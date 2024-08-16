import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { store } from "./redux/store.ts";
import { Provider } from "react-redux";
import Example from "./modules/example/pages/example.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        path: "example",
        Component: Example,
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
