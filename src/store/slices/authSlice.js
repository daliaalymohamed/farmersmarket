import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "@/lib/services/apis/authApi"; // Import authApi

// Get token and user from localStorage if available
const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
const storedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

// ✅ Async Login Thunk
// This thunk handles the login process
// It uses the authApi to make an API call and returns the user data or an error message
// The thunk is created using createAsyncThunk, which automatically handles the pending, fulfilled, and rejected states
// It also uses the rejectWithValue function to return a custom error message if the API call fails
// The thunk takes the credentials as an argument and returns the user data or an error message
// The thunk is dispatched from the Login component when the user submits the login form
// The thunk is used to handle the login process and update the Redux store with the user data or error message
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (credentials) => {
    const data = await authApi.login(credentials); // your API call
    return data;
    }
);

// ✅ Async logout thunk 
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn("Logout API failed — ignoring because we're doing local cleanup anyway.");
      // Still proceed with local cleanup
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
);

// ✅ Async Register Thunk
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData) => {
    const data = await authApi.register(userData); // your API call
    return data;
  }
);

// ✅ Async Check Auth Thunk
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");

      const data = await authApi.verifyToken(token); // your API call
      if (!data) {
        return thunkAPI.rejectWithValue("No data returned");
      }
      return data;
    } catch (error) {
      console.error("Auth check failed:", error?.response?.data || error.message);
      return thunkAPI.rejectWithValue("Invalid token");
    }
  }
);

// ✅ Async Sync Google Login Thunk
export const syncGoogleLogin = createAsyncThunk(
  "auth/syncGoogleLogin",
  async (payload, { rejectWithValue }) => {
    try {
      // Handle both old format (session) and new format (token + user object)
      let token, user;
      
      if (payload?.token && payload?.user) {
        // New format: { token, user }
        token = payload.token;
        user = payload.user;
      } else if (payload?.user?.customToken) {
        // Session format: { user: { customToken, ... } }
        token = payload.user.customToken;
        user = {
          _id: payload.user.userId,
          email: payload.user.email,
          firstName: payload.user.firstName || "",
          lastName: payload.user.lastName || "",
          roleId: payload.user.roleId,
        };
      }

      if (!token) {
        return rejectWithValue("No token available");
      }

      return {
        token,
        user,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to sync Google login");
    }
  }
);

// ✅ Initial state for the auth slice
// This state is used to manage the authentication status of the user
const initialState = {
  token: storedToken || null,
  user: storedUser || null,
  isloggedIn: !!storedToken,
  loading: false,
  error: null,
  actions: storedUser?.roleId?.actions || null,
  actionsLoaded: false, // Tracks if permissions are ready
};

// ✅ Create a slice for authentication
const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {}, // no manual logout reducer anymore
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.user.token;
        state.user = action.payload.user;
        state.isloggedIn = true;
        state.actions = action.payload.user.roleId.actions || [];
        state.actionsLoaded = true; // ✅ Now fully loaded

        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.user.token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })

      //logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isloggedIn = false;
        state.actions = [];
        state.error = null;
      })

     // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // No state updates for registration since the user is redirected to login
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })

      // check valid token
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        const user = action.payload; // since `verifyToken` returns user directly
        state.token = user.token;
        state.user = user;
        state.isloggedIn = true;
        state.loading = false;
        state.error = null;
        state.actions = user.roleId?.actions || [];
        state.actionsLoaded = true; // ✅ Now fully loaded

        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isloggedIn = false;
        state.user = null;
        state.token = null;
        state.actions = [];
        state.actionsLoaded = true; // ✅ Even if rejected, we know there are no actions
        localStorage.removeItem("token");
        localStorage.removeItem("user")
      })
      // Sync Google Login
      .addCase(syncGoogleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncGoogleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isloggedIn = true;
        state.actions = action.payload.user.roleId?.actions || [];
        state.actionsLoaded = true;

        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        }
      })
      .addCase(syncGoogleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Google login failed";
      })
  },
});

export default authSlice.reducer;