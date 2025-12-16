import { configureStore } from "@reduxjs/toolkit";
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance";
import authReducer from "./slices/authSlice";
import categoriesReducer from "./slices/categorySlice";
import productsReducer from './slices/productSlice';
import vendorsReducer from "./slices/vendorSlice";
import shippingZonesReducer from "./slices/shippingZonesSlice";
import usersReducer from "./slices/userSlice";
import cartReducer from './slices/cartSlice'
import rolesReducer from "./slices/roleSlice";
import actionsReducer from "./slices/actionSlice";

// Create a function to initialize the store
export const makeStore = () =>
  configureStore({
    reducer: {
      categories: categoriesReducer,
      products: productsReducer,
      vendors: vendorsReducer,
      zones: shippingZonesReducer,
      auth: authReducer,
      users: usersReducer,
      cart: cartReducer,
      roles: rolesReducer,
      actions: actionsReducer
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
