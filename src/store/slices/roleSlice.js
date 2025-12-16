import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { roleApi } from "@/lib/services/apis/roleApi"; // Import roleApi
import { getRoles } from "@/app/actions/roles/serverRolesData";


// Import the server-side function to fetch roles
export const fetchRoles = createAsyncThunk(
  "roles/fetchRoles",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const data = await getRoles(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create a new role
export const addRole = createAsyncThunk(
  "roles/addRole",
  async (roleData, { rejectWithValue }) => {
    try {
      const data = await roleApi.addRole(roleData); // Use roleApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Edit role
export const editRole = createAsyncThunk(
  "roles/editRole",
  async ({ roleId, roleData }, { rejectWithValue }) => {
    try {
      const data = await roleApi.editRole(roleId, roleData); // Use roleApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Assign action to role
export const assignActionToRole = createAsyncThunk(
  "roles/assignActionToRole",
  async ({ roleId, actionIds }, { rejectWithValue }) => {
    try {
      const data = await roleApi.assignActionToRole(roleId, actionIds); // Use roleApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Remove action from role
export const removeActionFromRole = createAsyncThunk(
  "roles/removeActionFromRole",
  async ({ roleId, actionIds }, { rejectWithValue }) => {
    try {
      const data = await roleApi.removeActionFromRole(roleId, actionIds); // Use roleApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const rolesSlice = createSlice({
  name: "roles",
  initialState: {
    rolesList: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Update a role in the list
    // This is useful when a role is edited
    updateRoleInList: (state, action) => {
      const updatedRole = action.payload;
      if (!updatedRole || !updatedRole._id) {
          console.warn('updateRoleInList called without valid role data');
          return;
      }

      const index = state.rolesList.findIndex(v => v._id === updatedRole._id);
      if (index !== -1) {
        // ✅ Replace entire object
        state.rolesList[index] = { ...updatedRole };
      } else {
        state.rolesList.push(updatedRole);
      }
    },
  },
  extraReducers: (builder) => {
    builder
        // 🔹 FETCH ROLES
        .addCase(fetchRoles.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchRoles.fulfilled, (state, action) => {
          state.loading = false;
          state.rolesList = Array.isArray(action.payload?.roles) ? action.payload.roles : [];
          
        })
        .addCase(fetchRoles.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || 'Failed to fetch roles';
        })
        // Add Role
        .addCase(addRole.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addRole.fulfilled, (state, action) => {
            state.loading = false;
            state.rolesList.push(action.payload.role);
        })
        .addCase(addRole.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        // Edit Role
        .addCase(editRole.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(editRole.fulfilled, (state, action) => {
            state.loading = false;
            // Update the role in the list
            const updatedRole = action.payload.role;
            const index = state.rolesList.findIndex(role => role._id === updatedRole._id);
            if (index !== -1) {
            state.rolesList[index] = updatedRole; // Update the category in the list
            }
        })
        .addCase(editRole.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        // Assign Action to Role
        .addCase(assignActionToRole.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(assignActionToRole.fulfilled, (state, action) => {
            state.loading = false;
            // add action to the list
            const updatedRole = action.payload.role;
            const index = state.rolesList.findIndex(role => role._id === updatedRole._id);
            if (index !== -1) {
              state.rolesList[index] = updatedRole; // Update the role in the list
            }
        })
        .addCase(assignActionToRole.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        // Remove Action from Role
        .addCase(removeActionFromRole.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(removeActionFromRole.fulfilled, (state, action) => {
          state.loading = false;
            // Update the role in the list
            const updatedRole = action.payload.role;
            const index = state.rolesList.findIndex(role => role._id === updatedRole._id);
            if (index !== -1) {
              state.rolesList[index] = updatedRole; // Update the role in the list
            }
        })
        .addCase(removeActionFromRole.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
  }
});

export const { updateRoleInList } = rolesSlice.actions;

export default rolesSlice.reducer;