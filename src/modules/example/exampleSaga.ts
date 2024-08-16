import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  Todo,
  queryTodosFailed,
  queryTodosRequest,
  queryTodosSucess,
} from "./exampleSlice";
import axios from "axios";

function* getTodosExample() {
  try {
    const todos: { data: Todo[] } = yield call(async () => {
      return await axios.get(
        "https://fakestoreapi.com/products/category/jewelery"
      );
    });

    yield put(queryTodosSucess(todos.data));
  } catch (error) {
    yield put(queryTodosFailed());
  }
}

function* getApiExample() {
  yield takeLatest(queryTodosRequest, getTodosExample);
}
export default function* exampleSaga() {
  yield all([getApiExample()]);
}
