import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
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

// ✅ Async toggle User Active Status Thunk
export const toggleUserActiveStatus = createAsyncThunk(
  "users/toggleUserActiveStatus",
  async ({ userId, active }) => {
    const data = await customersApi.toggleUserActiveStatus(userId, active);
    return data;
  }
);

// ✅ Async Edit Profile Thunk
export const editProfile = createAsyncThunk(
  "users/editProfile",
  async ({ userId, profile, newAddress, editAddress, removeAddressId }, { rejectWithValue }) => {
    try {
      const payload = {};
      if (profile) payload.profile = profile;
      if (newAddress) payload.newAddress = newAddress;
      if (editAddress) payload.editAddress = editAddress;
      if (removeAddressId) payload.removeAddressId = removeAddressId;

      const data = await customersApi.editProfile(userId, payload);
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ Initial state for the users slice
// This state is used to manage the customers/users data in the Redux store
const initialState = {
  list: [], // array of customers
  loading: false,
  error: null,
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
    // Update a customer in the list
    // This is useful when a customer is edited
    updateCustomerInList: (state, action) => {
      const updatedCustomer = action.payload;
      if (!updatedCustomer || !updatedCustomer._id) {
          console.warn('updateCustomerInList called without valid customer data');
          return;
      }

      const index = state.list.findIndex(v => v._id === updatedCustomer._id);
      if (index !== -1) {
        // ✅ Replace entire object
        state.list[index] = { ...updatedCustomer };
      } else {
        state.list.push(updatedCustomer);
      }
    },
    // Clear the customers list
    clearCustomers: (state) => {
      state.list = [];
      state.pagination = initialState.pagination;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // getCustomers
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
      })
      // toggleUserActiveStatus
      .addCase(toggleUserActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
     .addCase(toggleUserActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update user in the list
        const index = state.list.findIndex(user => user._id === action.payload.user._id);
        if (index !== -1) {
          state.list[index] = action.payload.user;
        }
      })
      .addCase(toggleUserActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // editProfile
      .addCase(editProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Update the user in the list
        const updatedUser = action.payload;
        const idx = state.list.findIndex(u => u._id === updatedUser._id);
        if (idx !== -1) {
          state.list[idx] = updatedUser;
        } else {
          state.list.push(updatedUser);
        }
      })
      .addCase(editProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selector to get the customers list
const selectCustomersList = (state) => state.users?.list || [];

// Selector to get customer by ID
export const selectCustomerById = createSelector(
  selectCustomersList,
  (state, userId) => userId,
  (list, userId) => {
    if (!userId || !list || list.length === 0) {
      return null;
    }
    return list.find(customer => customer._id === userId) || null;
  }
);

// ✅ Export actions
export const { clearCustomers, updateCustomerInList } = userSlice.actions;

export default userSlice.reducer;