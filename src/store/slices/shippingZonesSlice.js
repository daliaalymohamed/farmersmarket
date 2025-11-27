import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { shippingZoneApi } from "@/lib/services/apis/shippingZoneApi"; 
import { getShippingZones } from "@/app/actions/shippingZones/serverShippingZonesData";

// Import the server-side function to fetch zones
export const fetchZones = createAsyncThunk(
  "shippingZones/fetchZones",
  async ({ rejectWithValue }) => {
    try {
      const data = await getShippingZones();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to add a new zone
export const addZone = createAsyncThunk(
  "shippingZones/addZone",
  async (zoneData, { rejectWithValue }) => {
    try {
      const data = await shippingZoneApi.addZone(zoneData); // Use shippingZoneApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// async thunk to edit a zone
export const editZone = createAsyncThunk(
  "shippingZones/editZone",
  async ({ zoneId, zoneData }, { rejectWithValue }) => {
    try {
      const data = await shippingZoneApi.editZone(zoneId, zoneData); // Use shippingZoneApi
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ Async toggle Zone Active Status Thunk
export const toggleZoneActiveStatus = createAsyncThunk(
  "shippingZones/toggleZoneActiveStatus",
  async ({ zoneId, active }, { rejectWithValue }) => {
    try {
      const data = await shippingZoneApi.toggleZoneActiveStatus(zoneId, active);
    return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
    
  }
);

// ✅ Async bulk toggle Zones Status Thunk
export const bulkToggleZoneStatus = createAsyncThunk(
  "shippingZones/bulkToggleZoneStatus",
  async ({ zoneIds, active }, { rejectWithValue }) => {
    try {
      const response = await shippingZoneApi.bulkToggleZoneActiveStatus(zoneIds, active);
      return response; // Should return array of updated zones
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update zones');
    }
  }
);

// ✅ Initial state for the zones slice
const initialState = {
    zonesList: [],
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
  
const zonesSlice = createSlice({
  name: "shippingZones",
  initialState: initialState,
  reducers: {
    // Initialize zones with data from server
    // This is useful when the modal opens or when the page loads
    // It sets the zonesList and pagination,
    initializeZones: (state, action) => {
      const { zones, pagination } = action.payload;
      state.zonesList = zones || [];
      state.pagination = pagination || initialState.pagination;
    },
    // Update a zone in the list
    // This is useful when a zone is edited
    updateZoneInList: (state, action) => {
      const updatedZone = action.payload;
      
      if (!updatedZone || !updatedZone._id) {
          console.warn('updateZoneInList called without valid zone data');
          return;
      }
      
      const index = state.zonesList.findIndex(zone => zone._id === updatedZone._id);
      
      if (index !== -1) {
        // ✅ Deep merge to preserve nested objects
        state.zonesList[index] = {
          ...state.zonesList[index],
          ...updatedZone,
          // Ensure ID is preserved
          _id: updatedZone._id
      };
      } else {
          // Zone doesn't exist, add it to the list
          state.zonesList.push(updatedZone);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Zone
      .addCase(addZone.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(addZone.fulfilled, (state, action) => {
        state.loading = false;
        state.zonesList.push(action.payload.zone);
      })
      .addCase(addZone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Zone
      .addCase(editZone.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(editZone.fulfilled, (state, action) => {
        state.loading = false;
        
        const updatedZone = action.payload.zone || action.payload;
        const zoneId = action.payload.zoneId || updatedZone._id;
        
        if (zoneId && updatedZone) {
          const index = state.zonesList.findIndex(zone => zone._id === zoneId);
          if (index !== -1) {
            // ✅ Merge with existing data to preserve populated fields
            state.zonesList[index] = {
              ...state.zonesList[index], // Preserve existing data
              ...updatedZone,
              // Explicitly preserve populated relationships
              _id: zoneId
            };
          }
        }
      })
      .addCase(editZone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // toggleZoneActiveStatus
      .addCase(toggleZoneActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleZoneActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedZone = action.payload.zone;
        
        if (updatedZone && updatedZone._id) {
          const index = state.zonesList.findIndex(zone => zone._id === updatedZone._id);
          if (index !== -1) {
            // ✅ Preserve existing data and merge updates
            state.zonesList[index] = {
              ...state.zonesList[index],
              ...updatedZone,
              // Ensure critical fields are preserved
              _id: updatedZone._id,
            };
          }
        }
      })
      .addCase(toggleZoneActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle zone status';
        console.error('Toggle zone status failed:', action.payload);
      })
      // bulkToggleZoneStatus
      .addCase(bulkToggleZoneStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkToggleZoneStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedZones = action.payload.zones;

        updatedZones.forEach(updatedZone => {
          const index = state.zonesList.findIndex(v => v._id === updatedZone._id);
          if (index !== -1) {
            state.zonesList[index] = updatedZone;
          }
        });
      })
      .addCase(bulkToggleZoneStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Selector to get the zones list
const selectZonesList = (state) => state.zones?.zonesList || [];

// Selector to get zone by ID
export const selectZoneById = createSelector(
  selectZonesList, 
  (state, zoneId) => zoneId,
  (zonesList, zoneId) => {
    if (!zoneId || !zonesList || zonesList.length === 0) {
      return null;
    }
    return zonesList.find(zone => zone._id === zoneId) || null;
  }
);

export const { initializeZones, updateZoneInList } = zonesSlice.actions;

export default zonesSlice.reducer;