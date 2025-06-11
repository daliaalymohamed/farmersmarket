import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { customersApi } from "@/lib/services/apis/userApi";

// Get token and user from localStorage if available
const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
const storedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

// ✅ Async Get Customer Thunk
export const getCustomers = createAsyncThunk(
    "users/getCustomers",
    async (filters) => {
    const data = await customersApi.fetchCustomers(filters); // your API call
    return data;
    }
);


// ✅ Initial state for the users slice
// This state is used to manage the customers/users data in the Redux store
const initialState = {
  list: [], // array of customers
  loading: false,
  error: null,
  filters: {
    search: "",
    active: "",
    startDate: null,
    endDate: null,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 3, // default limit per page
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

// ✅ Create a slice for customers/users
const userSlice = createSlice({
  name: "users",
  initialState: initialState,
  reducers: {
    clearCustomers: (state) => {
      state.list = [];
      state.pagination = initialState.pagination;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.users;
        state.pagination = {
          total: action.payload.pagination.total,
          page: action.payload.pagination.page,
          limit: action.payload.pagination.limit,
          totalPages: action.payload.pagination.totalPages,
          hasNextPage: action.payload.pagination.hasNextPage,
          hasPrevPage: action.payload.pagination.hasPrevPage,
        };
      })
      .addCase(getCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ✅ Export actions
export const { clearCustomers } = userSlice.actions;

export default userSlice.reducer;