import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { getActions } from "@/app/actions/actions/serverActionsData";

export const fetchAllActions = createAsyncThunk(
  "actions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getActions();
      return data.actions;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const actionSlice = createSlice({
  name: "actions",
  initialState: {
    actionsList: [],
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllActions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllActions.fulfilled, (state, action) => {
        state.loading = false;
        state.actionsList = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ✅ Selectors
// ✅ createSelector memoizes the result
// ✅ Only recalculates when state.actions changes
// ✅ Prevents unnecessary re-renders
// ✅ Eliminates the warning
// Basic selector for actions state
const selectActionsState = (state) => state.actions;

// Memoized selector
export const selectAllActions = createSelector(
  [selectActionsState],
  (actionsState) => {
    return {
      actionsList: Array.isArray(actionsState?.actionsList) ? actionsState.actionsList : [],
      loading: Boolean(actionsState?.loading),
      error: actionsState?.error || null
    };
  }
);

export default actionSlice.reducer;