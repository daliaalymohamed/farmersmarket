import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { categoryApi } from "@/lib/services/apis/categoryApi"; // Import categoryApi

// Create a new category
export const addCategory = createAsyncThunk(
  "categories/addCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await categoryApi.addCategory(categoryData); // Use categoryApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// editCategory
export const editCategory = createAsyncThunk(
  "categories/editCategory",
  async ({ categoryId, categoryData }, { rejectWithValue }) => {
    try {
      const data = await categoryApi.editCategory(categoryId, categoryData); // Use categoryApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// deleteCategory
export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      const data = await categoryApi.deleteCategory(categoryId); // Use categoryApi
      return { ...data, categoryId }; // Return the categoryId along with response data
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Add Category
      .addCase(addCategory.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Category
      .addCase(editCategory.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(editCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Update the category in the list
        const updatedCategory = action.payload;
        const index = state.list.findIndex(cat => cat._id === updatedCategory._id);
        if (index !== -1) {
          state.list[index] = action.payload; // Update the category in the list
        }
      })
      .addCase(editCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted category from the list
        const categoryId = action.payload.categoryId;
        state.list = state.list.filter(cat => cat._id !== categoryId);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  }
});

export default categoriesSlice.reducer;