import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { categoryApi } from "@/lib/services/apis/categoryApi"; // Import categoryApi

// Fetch all categories
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (locale, { rejectWithValue }) => {
    try {
      const data = await categoryApi.getAllCategories(locale); // Use categoryApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Create a new category
export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await categoryApi.createCategory(categoryData); // Use categoryApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default categoriesSlice.reducer;