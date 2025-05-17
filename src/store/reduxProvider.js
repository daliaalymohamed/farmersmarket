"use client";

import { Provider } from "react-redux";
import { getStore } from "./store";

const ReduxProvider = ({ children }) => {
  const store = getStore();
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
