import axios, {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import moment from "moment";
import qs from "qs";
import { v4 as uuidv4 } from "uuid";
import {
  API_REQUEST_TIMEOUT,
  REQUEST_LOGOUT_CODE,
  REQUEST_LOGOUT_MESSAGE,
  RESPONSE_CODE,
} from "../helper/constants";
import { loginUrl, refreshTokenUrl } from "./urls";
import { storage } from "../helper/storage";
import { CmnError } from "../helper/cmnTypes";
import { RESTFUL_AUTH_URL } from "../config/appConfig";

enum LogType {
  REQUEST = "req",
  RESPONSE = "res",
  ERROR = "err",
}

const log = (...params: any) => {
  if (process.env.NODE_ENV === `development`) {
    console.warn(...params);
  }
};

const requestLog = (
  method: string = "",
  url: string = "",
  data: unknown,
  type: LogType,
  baseURL: string
) => {
  const tag =
    type === LogType.REQUEST || type === LogType.RESPONSE
      ? method
      : LogType.ERROR;
  const colors = {
    [LogType.REQUEST]: "blue",
    [LogType.RESPONSE]: "green",
    [LogType.ERROR]: "red",
  };
  const icons = {
    [LogType.REQUEST]: ">>>",
    [LogType.RESPONSE]: "<<<",
    [LogType.ERROR]: "xxx",
  };

  log(
    `%c${icons[type]} [${tag.toUpperCase()}] | %c${url.replace(
      baseURL,
      ""
    )} \n`,
    `color: ${colors[type]}; font-weight: bold`,
    "color: violet; font-weight: bold",
    data
  );
};

const headers = {
  Authorization: "Basic",
  "Content-Type": "application/json",
};

abstract class HttpClient {
  protected instance: AxiosInstance;
  protected refreshTokenRequest: AxiosPromise | null;
  protected requestQueue: AxiosRequestConfig[];
  protected requestQueueTime: AxiosRequestConfig[];
  protected requestStartTime: number;

  public constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      headers,
      timeout: API_REQUEST_TIMEOUT,
    });
    this.refreshTokenRequest = null;
    this.requestQueue = [];
    this.requestQueueTime = [];
    this.requestStartTime = new Date().getTime();
    this._initializeResponseInterceptor();
  }

  protected setBaseUrl(baseURL: string) {
    this.instance.defaults.baseURL = baseURL;
  }

  private releaseQueuedRequests() {
    if (this.requestQueue.length > 0) {
      this.requestQueue.forEach((req) => {
        this.instance.request(req);
      });
      this.requestQueue = [];
    }
  }

  private createRefreshRequest = (failedRequestConfig?: AxiosRequestConfig) => {
    if (!storage.getRefreshToken()) {
      this.refreshTokenRequest = null;
      storage.logOut();
      return;
    }
    const refreshToken = storage.getRefreshToken() || "xxx";

    if (failedRequestConfig) {
      this.requestQueue.push(failedRequestConfig);
    }

    if (!this.refreshTokenRequest) {
      this.refreshTokenRequest = axios
        .post(
          refreshTokenUrl,
          qs.stringify({
            refreshToken: refreshToken,
          }),
          { baseURL: RESTFUL_AUTH_URL }
        )
        .then((token) => {
          storage.setRefreshToken(token?.data?.refresh_token);
          storage.setTimeRefreshToken(
            parseInt(moment().format("X")) + token?.data?.refresh_expires_in
          );
          storage.setAccessToken(token?.data?.access_token);
          storage.setTimeAccessToken(
            parseInt(moment().format("X")) + token?.data?.expires_in
          );
          this.releaseQueuedRequests();
          this.refreshTokenRequest = null;
          return Promise.resolve(token);
        })
        .catch(() => {
          this.refreshTokenRequest = null;
          storage.logOut();
          return Promise.reject();
        });
      return this.refreshTokenRequest;
    }
  };

  private _initializeResponseInterceptor = () => {
    this.instance.interceptors.request.use(
      this._handleRequest,
      this._handleRequestError
    );

    this.instance.interceptors.response.use(
      this._handleResponse,
      this._handleError
    );
  };

  private _handleRequest = (req: AxiosRequestConfig) => {
    const token = storage.getAccessToken() || "";
    if (req.headers) {
      if (token && req.url !== loginUrl) {
        req.headers["Authorization"] = `Bearer ${token}`;
      }
      req.headers["x-client-request-id"] = uuidv4();
      const deviceInfo = storage.getDeviceInfo();
      if (deviceInfo?.curIP) {
        req.headers["deviceId"] = deviceInfo?.curIP;
      }
    }

    requestLog(req.method, req.url, req, LogType.REQUEST, req.baseURL || "");
    this.requestStartTime = new Date().getTime();
    return req;
  };

  private _handleRequestError = (error: any) => {
    log("request.error", error?.response?.data);
    return Promise.reject(error);
  };

  private _handleResponse = (response: AxiosResponse) => {
    const {
      config: { method, url, baseURL },
    } = response;
    requestLog(method, url, response, LogType.RESPONSE, baseURL || "");
    response.request.totalTime = new Date().getTime() - this.requestStartTime;

    const codeFormatter = `error.${response?.data?.errorCode}`;

    // Logout theo mã lỗi hoặc description không thông báo mã lỗi
    if (
      REQUEST_LOGOUT_CODE.includes(codeFormatter) ||
      REQUEST_LOGOUT_MESSAGE.includes(response?.data?.message)
    ) {
      storage.logOut();
    }

    // Nếu lỗi
    if (
      response?.data?.error ||
      response?.data?.status === "Fail" ||
      response?.data?.statusCode === 1
    ) {
      if (response?.data?.statusCode) {
        const errorData: CmnError = {
          code: codeFormatter,
          description: response?.data?.message,
        };
        return Promise.reject(errorData);
      }

      const errorData: CmnError = {
        code: codeFormatter,
        description: response?.data?.error.message,
      };
      return Promise.reject(errorData);
    }

    return response;
  };

  protected _handleError = (error: any) => {
    const httpCode = error?.response?.status;
    let errorData: CmnError = error?.response?.data;
    const config = error?.response?.config;
    if (error?.response) {
      error.response.request.totalTime =
        new Date().getTime() - this.requestStartTime;
    }

    const serverCode = errorData?.code; //801
    const serverMessage = errorData?.description ?? "error.errorServer";
    let clientCode = serverCode;

    // Handle some special http errors
    if (
      [404, 500, 501, 502, 503, 504].includes(httpCode) ||
      httpCode === undefined
    ) {
      clientCode = "error.errorServer";
    } else if (serverCode) {
      clientCode = `error.${serverCode}`;
    }

    errorData = {
      code: clientCode ?? serverMessage, // Key của intl
      description: serverMessage, // default message cho intl
    };
    if (
      httpCode === RESPONSE_CODE.TOKEN_EXPIRED &&
      config?.url !== loginUrl &&
      config?.url !== refreshTokenUrl
    ) {
      this.createRefreshRequest(error.config);
    }

    if (httpCode !== RESPONSE_CODE.TOKEN_EXPIRED || config?.url === loginUrl) {
      // Login => đặc biệt
      if (config?.url === loginUrl) {
        errorData.code = "";
      }

      return Promise.reject(errorData);
    }
  };

  public get = <T>(
    url: string,
    params = {},
    config: AxiosRequestConfig = {}
  ): AxiosPromise<T> => this.instance.get<T>(url, { params, ...config });

  public post = <T>(
    url: string,
    data: unknown = {},
    config: AxiosRequestConfig = {}
  ) => this.instance.post<T>(url, data, { ...config });

  public put = <T>(
    url: string,
    data: unknown = {},
    config: AxiosRequestConfig = {}
  ) => this.instance.put<T>(url, data, { ...config });

  public patch = <T>(
    url: string,
    data: unknown = {},
    config: AxiosRequestConfig = {}
  ) => this.instance.patch<T>(url, data, { ...config });

  public delete = <T>(url: string, config: AxiosRequestConfig = {}) =>
    this.instance.delete<T>(url, { ...config });
}

export default HttpClient;
