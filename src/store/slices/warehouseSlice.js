import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { warehouseApi } from "@/lib/services/apis/warehouseApi";
import { getWarehouses } from '@/app/actions/warehouses/serverWarehousesData';

// ✅ Async fetchWarehouses Thunk
export const fetchWarehouses = createAsyncThunk(
  "warehouses/fetchWarehouses",
  async (filters, { rejectWithValue }) => {
    try {
          const data = await getWarehouses(filters);
          return data;
    } catch (error) {
          return rejectWithValue(error.message);
    }
  }
);
// ✅ Async add a new warehouse Thunk
export const addWarehouse = createAsyncThunk(
  "warehouses/addWarehouse",
  async (warehouseData, { rejectWithValue }) => {
    try {
      const data = await warehouseApi.addWarehouse(warehouseData); // Use warehouseApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// ✅ Async editWarehouse Thunk
export const editWarehouse = createAsyncThunk(
  "warehouses/editWarehouse",
  async ({ warehouseId, warehouseData }, { rejectWithValue }) => {
    try {
      const data = await warehouseApi.editWarehouse(warehouseId, warehouseData); // Use warehouseApi
      return { 
        ...data, 
        warehouseId,
        // Ensure we have the updated warehouse data
        warehouse: data.warehouse || data
      }; // Return the warehouseId along with response data
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ Async toggle Warehouse Active Status Thunk
export const toggleWarehouseActiveStatus = createAsyncThunk(
  "warehouses/toggleWarehouseActiveStatus",
  async ({ warehouseId, active }, { rejectWithValue }) => {
    try {
      const data = await warehouseApi.toggleWarehouseActiveStatus(warehouseId, active);
    return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
    
  }
);

// ✅ Async bulk toggle Warehouse Active Status Thunk
export const bulkToggleWarehouseActiveStatus = createAsyncThunk(
  "warehouses/bulkToggleWarehouseActiveStatus",
  async ({ warehouseIds, active }, { rejectWithValue }) => {
    try {
      const data = await warehouseApi.bulkToggleWarehouseActiveStatus(warehouseIds, active);
    return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ Initial state for the warehouse slice
const initialState = {
  warehousesList: [],
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

// ✅ Create a slice for warehouses
const warehouseSlice = createSlice({
  name: "warehouses",
  initialState: initialState,
  reducers: {
    // Update warehouse in list
    updateWarehouseInList: (state, action) => {
      const index = state.warehousesList.findIndex(w => w._id === action.payload._id);
      if (index !== -1) {
        state.warehousesList[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch all warehouses
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both cases: with and without warehouses
        state.warehousesList = Array.isArray(action.payload.warehouses) 
          ? action.payload.warehouses 
          : [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // add warehouse
      .addCase(addWarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWarehouse.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new warehouse to the beginning of the list
        state.warehousesList.unshift(action.payload.warehouse || action.payload);
      })
      .addCase(addWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // edit warehouse
      .addCase(editWarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editWarehouse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.warehousesList.findIndex(w => w._id === action.payload.warehouseId);
        if (index !== -1) {
          // Update the warehouse in the list
          state.warehousesList[index] = action.payload.warehouse || action.payload;
        }
      })
      .addCase(editWarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // toggle warehouse active status
      .addCase(toggleWarehouseActiveStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleWarehouseActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        const warehouse = action.payload.warehouse;
        const index = state.warehousesList.findIndex(w => w._id === warehouse._id);
        if (index !== -1) {
          state.warehousesList[index] = warehouse;
        }
      })
      .addCase(toggleWarehouseActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // bulk toggle warehouse active status
      .addCase(bulkToggleWarehouseActiveStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkToggleWarehouseActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { warehouses } = action.payload;
        warehouses.forEach(updatedWarehouse => {
          const index = state.warehousesList.findIndex(w => w._id === updatedWarehouse._id);
          if (index !== -1) {
            state.warehousesList[index] = updatedWarehouse;
          }
        });
      })
      .addCase(bulkToggleWarehouseActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateWarehouseInList } = warehouseSlice.actions;

// Selectors
export const selectWarehouses = state => state.warehouses.list;
export const selectWarehousesLoading = state => state.warehouses.loading;
export const selectWarehousesError = state => state.warehouses.error;
export const selectWarehousesPagination = state => state.warehouses.pagination;

// Selector to get warehouses list
export const selectWarehousesList = state => state.warehouses?.warehousesList || [];

// Memoized selector to get warehouse by ID
export const selectWarehouseById = createSelector(
  selectWarehousesList,
  (state, warehouseId) => warehouseId,
  (warehousesList, warehouseId) => {
    if (!warehouseId || !warehousesList || warehousesList.length === 0) {
      return null;
    }
    return warehousesList.find(w => w._id === warehouseId) || null;
  }
);

export default warehouseSlice.reducer;
