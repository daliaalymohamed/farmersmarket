const API_BASE_URL = "/api/warehouses"; // Next.js API Route
import { api } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const warehouseApi = {
  // Add a new warehouse
  addWarehouse: async (warehouseData) => {
    const response = await api.post(API_BASE_URL, warehouseData); // Use apiInstance
    return response.data;
  },

  // Edit an existing warehouse
  editWarehouse: async (warehouseId, warehouseData) => {
    const response = await api.put(`${API_BASE_URL}/${warehouseId}`, warehouseData); // Use apiInstance
    return response.data;
  },

  // toggle Warehouse Active Status
  toggleWarehouseActiveStatus: async (warehouseId, active) => {
      const response = await api.patch(`${API_BASE_URL}/${warehouseId}`, { active });
      return response.data;
  },

  // Bulk toggle Warehouse Active Status
  bulkToggleWarehouseActiveStatus: async (warehouseIds, active) => {
  const response = await api.patch(API_BASE_URL, {
    warehouseIds,
    active
  });
  return response.data;
}
  
}
