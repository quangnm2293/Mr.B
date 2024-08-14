import { IDeviceInfo } from "./cmnTypes";
import {
  ACCESS_TOKEN_KEY,
  DEVICE_INFO,
  REFRESH_ACCESS_TOKEN_KEY,
  TIME_ACCESS_TOKEN_KEY,
  TIME_REFRESH_ACCESS_TOKEN_KEY,
} from "./constants";

export const storage = {
  setCookie(name: string, value: string, seconds?: number) {
    let expires = "";
    if (seconds) {
      const date = new Date();
      date.setTime(date.getTime() + seconds * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  },
  setRefreshToken(token: string, seconds?: number) {
    this.setCookie(REFRESH_ACCESS_TOKEN_KEY, token, seconds);
  },
  setTimeRefreshToken(seconds: string) {
    this.setCookie(TIME_REFRESH_ACCESS_TOKEN_KEY, seconds);
  },
  setAccessToken(token: string, seconds?: number) {
    this.setCookie(ACCESS_TOKEN_KEY, token, seconds);
  },
  setTimeAccessToken(seconds: string) {
    this.setCookie(TIME_ACCESS_TOKEN_KEY, seconds);
  },
  get(key: string, defaultValue: string = "") {
    const value = localStorage.getItem(key);

    return value ? value : defaultValue;
  },
  getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null ?? "";
  },
  getAccessToken(): string {
    return this.getCookie(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string {
    return this.getCookie(REFRESH_ACCESS_TOKEN_KEY);
  },
  getDeviceInfo(): IDeviceInfo {
    const data: string = this.get(DEVICE_INFO);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  },
  logOut() {
    if (this.getAccessToken()) {
      console.log("Logged out");
    }
  },
};
