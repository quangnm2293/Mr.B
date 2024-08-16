import { all } from "redux-saga/effects";
import exampleSaga from "../modules/example/exampleSaga";

export default function* rootSaga() {
  yield all([exampleSaga()]);
}
