import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { vendorApi } from "@/lib/services/apis/vendorApi"; // Import vendorApi
import { getVendors } from '@/app/actions/vendors/serverVendorsData';

// ✅ Async fetchVendors Thunk
export const fetchVendors = createAsyncThunk(
  "vendors/fetchVendors",
  async (filters, { rejectWithValue }) => {
    try {
      const data = await getVendors(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// ✅ Async add a new vendor Thunk
export const addVendor = createAsyncThunk(
  "vendors/addVendor",
  async (vendorData, { rejectWithValue }) => {
    try {
      const data = await vendorApi.addVendor(vendorData); // Use vendorApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// ✅ Async editVendor Thunk
export const editVendor = createAsyncThunk(
  "vendors/editVendor",
  async ({ vendorId, vendorData }, { rejectWithValue }) => {
    try {
      const data = await vendorApi.editVendor(vendorId, vendorData); // Use vendorApi
      return { 
        ...data, 
        vendorId,
        // Ensure we have the updated vendor data
        vendor: data.vendor || data
      }; // Return the vendorId along with response data
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ Async toggle Vendor Active Status Thunk
export const toggleVendorActiveStatus = createAsyncThunk(
  "vendors/toggleVendorActiveStatus",
  async ({ vendorId, active }) => {
    try {
      const data = await vendorApi.toggleVendorActiveStatus(vendorId, active);
    return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
    
  }
);

// ✅ Async bulk toggle Vendor Status Thunk
export const bulkToggleVendorStatus = createAsyncThunk(
  "vendors/bulkToggleVendorStatus",
  async ({ vendorIds, active }, { rejectWithValue }) => {
    try {
      const response = await vendorApi.bulkToggleVendorActiveStatus(vendorIds, active);
      return response; // Should return array of updated vendors
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update vendors');
    }
  }
);

// ✅ Initial state for the vendors slice
const initialState = {
    vendorsList: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 3, // default limit per page
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
 };
  
const vendorsSlice = createSlice({
  name: "vendors",
  initialState: initialState,
  reducers: {
    // Initialize vendors with data from server
    // This is useful when the modal opens or when the page loads
    // It sets the vendorsList and pagination
    initializeVendors: (state, action) => {
      const { vendors, pagination } = action.payload;
      state.vendorsList = vendors || [];
      state.pagination = pagination || initialState.pagination;
    },
    // Update a vendor in the list
    // This is useful when a vendor is edited
    updateVendorInList: (state, action) => {
      const updatedVendor = action.payload;
      if (!updatedVendor || !updatedVendor._id) {
          console.warn('updateVendorInList called without valid vendor data');
          return;
      }

      const index = state.vendorsList.findIndex(v => v._id === updatedVendor._id);
      if (index !== -1) {
        // ✅ Replace entire object
        state.vendorsList[index] = { ...updatedVendor };
      } else {
        state.vendorsList.push(updatedVendor);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Vendor
      .addCase(addVendor.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorsList.push(action.payload.vendor);
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Vendor
      .addCase(editVendor.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(editVendor.fulfilled, (state, action) => {
        state.loading = false;
        
        // Handle different possible response structures
        const updatedVendor = action.payload.vendor || action.payload;
        const vendorId = action.payload.vendorId || updatedVendor._id;
        
        if (vendorId && updatedVendor) {
          const index = state.vendorsList.findIndex(vendor => vendor._id === vendorId);
          if (index !== -1) {
            // Fixed: Ensure we completely replace the vendor data
            state.vendorsList[index] = {
              ...updatedVendor,
              _id: vendorId // Ensure ID is preserved
            };
          }
        }
      })
      .addCase(editVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // toggleVendorActiveStatus
      .addCase(toggleVendorActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleVendorActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update vendor in the vendor
        const index = state.vendorsList.findIndex(vendor => vendor._id === action.payload.vendor._id);
        if (index !== -1) {
          state.vendorsList[index] = action.payload.vendor;
        }
      })
      .addCase(toggleVendorActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // bulkToggleVendorStatus
      .addCase(bulkToggleVendorStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkToggleVendorStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedVendors = action.payload.vendors;

        updatedVendors.forEach(updatedVendor => {
          const index = state.vendorsList.findIndex(v => v._id === updatedVendor._id);
          if (index !== -1) {
            state.vendorsList[index] = updatedVendor;
          }
        });
      })
      .addCase(bulkToggleVendorStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Selector to get the vendors list
const selectVendorsList = (state) => state.vendors?.vendorsList || [];

// Selector to get vendor by ID
export const selectVendorById = createSelector(
  selectVendorsList,
  (state, vendorId) => vendorId,
  (vendorsList, vendorId) => {
    if (!vendorId || !vendorsList || vendorsList.length === 0) {
      return null;
    }
    return vendorsList.find(vendor => vendor._id === vendorId) || null;
  }
);

export const { initializeVendors, updateVendorInList } = vendorsSlice.actions;

export default vendorsSlice.reducer;