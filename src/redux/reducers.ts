import { combineReducers } from "@reduxjs/toolkit";
import exampleReducer from "../modules/example/exampleSlice";

export default combineReducers({
  example: exampleReducer,
});
