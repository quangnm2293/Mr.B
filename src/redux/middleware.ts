import createSagaMiddleware from "redux-saga";
import rootSaga from "./saga";
import { USE_REDUX_LOG } from "../config/appConfig";

const sagaMiddleware = createSagaMiddleware();

/**
 * Setup and return all middlewares needed for the development
 */
const getDevMiddlewares = () => {
  if (USE_REDUX_LOG) {
    // const { createLogger } = require(`redux-logger`);
    // const logger = createLogger();
    // return [logger];
  }

  return [];
};

/**
 * Setup middlewares
 *
 * This must be run after the [redux#applyMiddleware] function
 */
export const setupMiddleware = () => {
  sagaMiddleware.run(rootSaga);
};

const middlewares = [sagaMiddleware, ...getDevMiddlewares()];

export default middlewares;
