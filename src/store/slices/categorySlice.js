import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { categoryApi } from "@/lib/services/apis/categoryApi"; // Import categoryApi
import { getCategories } from "@/app/actions/categories/serverCategoriesData";

// Import the server-side function to fetch categories
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async ({ rejectWithValue }) => {
    try {
      const data = await getCategories();
      console.log("data => ", data)
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

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
    categoriesList: [],
    loading: false,
    error: null,
  },
  reducers: {
    initializeCategories: (state, action) => {
      state.categoriesList = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Add Category
      .addCase(addCategory.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categoriesList.push(action.payload.category);
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
        const updatedCategory = action.payload.category;
        const index = state.categoriesList.findIndex(cat => cat._id === updatedCategory._id);
        if (index !== -1) {
          state.categoriesList[index] = updatedCategory; // Update the category in the list
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
        state.categoriesList = state.categoriesList.filter(cat => cat._id !== categoryId);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  }
});

export const { initializeCategories } = categoriesSlice.actions;

export default categoriesSlice.reducer;