import { configureStore } from "@reduxjs/toolkit";
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance";
import authReducer from "./slices/authSlice";
import categoriesReducer from "./slices/categorySlice";

// Create a function to initialize the store
export const makeStore = () =>
  configureStore({
    reducer: {
      categories: categoriesReducer,
      auth: authReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: { api, apiWithoutAuth },
        },
        serializableCheck: false,
      }),
  });

// Singleton store for client-side usage
let store;

export const getStore = () => {
  if (!store) {
    store = makeStore();
  }
  return store;
};
