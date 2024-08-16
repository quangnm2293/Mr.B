import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type Todo = {
  id: string;
  title: string;
  description: string;
};
export type Todos = {
  todos: Todo[];
};

const initialState: Todos = {
  todos: [],
};

const exampleReducer = createSlice({
  name: "example",
  initialState: initialState,

  reducers: {
    queryTodosRequest: (state) => {
      state.todos = [];
    },
    queryTodosSucess: (state, action: PayloadAction<Todo[]>) => {
      console.log(action);

      state.todos = action.payload;
    },
    queryTodosFailed: (state) => {
      state.todos = [];
    },
  },
});

export const { queryTodosRequest, queryTodosSucess, queryTodosFailed } =
  exampleReducer.actions;

export default exampleReducer.reducer;
