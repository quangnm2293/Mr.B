import { useDispatch, useSelector } from "react-redux";
import { queryTodosRequest } from "../exampleSlice";
import { RootState } from "../../../redux/store";

export default function Example() {
  const dispatch = useDispatch();

  const todos = useSelector((state: RootState) => state.example.todos);

  return (
    <div className="bg-white/80 w-full h-screen">
      <button
        onClick={() => dispatch({ type: queryTodosRequest.type })}
        className="btn-primary"
      >
        Call API
      </button>
      <button
        onClick={() => dispatch({ type: queryTodosRequest.type })}
        className="btn-secondary"
      >
        Call API Secondary
      </button>
      {todos?.map((item) => {
        return (
          <div key={item.id} className="wrapper">
            <h1> {item.title} </h1>
            <p> {item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
