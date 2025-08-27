import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { productApi } from "@/lib/services/apis/productApi"; // Import categoryApi
import { getProducts } from '@/app/actions/products/serverProductsData';

// ✅ Async fetchProducts Thunk
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (filters, { rejectWithValue }) => {
    try {
      const data = await getProducts(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// ✅ Async add a new product Thunk
export const addProduct = createAsyncThunk(
  "products/addProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const data = await productApi.addProduct(productData); // Use productApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// ✅ Async editProduct Thunk
export const editProduct = createAsyncThunk(
  "products/editProduct",
  async ({ productId, productData }, { rejectWithValue }) => {
    try {
      const data = await productApi.editProduct(productId, productData); // Use productApi
      return { 
        ...data, 
        productId,
        // Ensure we have the updated product data
        product: data.product || data
      }; // Return the productId along with response data
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ Async toggle Product Active Status Thunk
export const toggleProductActiveStatus = createAsyncThunk(
  "products/toggleProductActiveStatus",
  async ({ productId, isActive }) => {
    try {
      const data = await productApi.toggleProductActiveStatus(productId, isActive);
      console.log("🚀 ~ file: productSlice.js:88 ~ data:", data);
    return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
    
  }
);

// ✅ Async bulk toggle Product Status Thunk
export const bulkToggleProductStatus = createAsyncThunk(
  "products/bulkToggleProductStatus",
  async ({ productIds, isActive }, { rejectWithValue }) => {
    try {
      const response = await productApi.bulkToggleProductActiveStatus(productIds, isActive);
      return response; // Should return array of updated vendors
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update products');
    }
  }
);


// ✅ Initial state for the products slice
const initialState = {
    productsList: [],
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
    stats: { 
      total: 0,
      active: 0,
      inactive: 0,
      lowStock: 0,
      totalValue: 0
    }
 };
  
const productsSlice = createSlice({
  name: "products",
  initialState: initialState,
  reducers: {
    // Initialize products with data from server
    // This is useful when the modal opens or when the page loads
    // It sets the productsList, pagination, and stats
    initializeProducts: (state, action) => {
      const { products, pagination, stats } = action.payload;
      state.productsList = products || [];
      state.pagination = pagination || initialState.pagination;
      if (stats) state.stats = stats;
    },
    // Update a product in the list
    // This is useful when a product is edited
    updateProductInList: (state, action) => {
      const updatedProduct = action.payload;
      
      if (!updatedProduct || !updatedProduct._id) {
          console.warn('updateProductInList called without valid product data');
          return;
      }
      
      const index = state.productsList.findIndex(prod => prod._id === updatedProduct._id);
      
      if (index !== -1) {
          // Product exists, merge with existing data to preserve any fields not in update
          state.productsList[index] = {
              ...state.productsList[index],
              ...updatedProduct,
              // Ensure we preserve the ID
              _id: updatedProduct._id
          };
      } else {
          // Product doesn't exist, add it to the list
          state.productsList.push(updatedProduct);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Product
      .addCase(addProduct.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.productsList.push(action.payload.product);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Product
      .addCase(editProduct.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(editProduct.fulfilled, (state, action) => {
        state.loading = false;
        
        // Handle different possible response structures
        const updatedProduct = action.payload.product || action.payload;
        const productId = action.payload.productId || updatedProduct._id;
        
        if (productId && updatedProduct) {
          const index = state.productsList.findIndex(prod => prod._id === productId);
          if (index !== -1) {
            // Fixed: Ensure we completely replace the product data
            state.productsList[index] = {
              ...updatedProduct,
              _id: productId // Ensure ID is preserved
            };
          }
        }
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // toggleVendorActiveStatus
      .addCase(toggleProductActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleProductActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update product in the list
        const index = state.productsList.findIndex(product => product._id === action.payload.product._id);
        if (index !== -1) {
          state.productsList[index] = action.payload.product;
        }
      })
      .addCase(toggleProductActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // bulkToggleVendorStatus
      .addCase(bulkToggleProductStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkToggleProductStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProducts = action.payload.products;

        updatedProducts.forEach(updatedProduct => {
          const index = state.productsList.findIndex(v => v._id === updatedProduct._id);
          if (index !== -1) {
            state.productsList[index] = updatedProduct;
          }
        });
      })
      .addCase(bulkToggleProductStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Selector to get the products list
const selectProductsList = (state) => state.products?.productsList || [];

// Selector to get product by ID
export const selectProductById = createSelector(
  selectProductsList, 
  (state, productId) => productId,
  (productsList, productId) => {
    if (!productId || !productsList || productsList.length === 0) {
      return null;
    }
    return productsList.find(product => product._id === productId) || null;
  }
);

export const { initializeProducts, updateProductInList } = productsSlice.actions;

export default productsSlice.reducer;