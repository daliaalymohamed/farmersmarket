const API_BASE_URL = "/api/shipping-zones"; // Next.js API Route
import { api } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const shippingZoneApi = {
  // Add a new zone
  addZone: async (zoneData) => {
    const response = await api.post(API_BASE_URL, zoneData); // Use apiInstance
    return response.data;
  },

  // Edit an existing zone
  editZone: async (zoneId, zonrData) => {
    const response = await api.put(`${API_BASE_URL}/${zoneId}`, zonrData); // Use apiInstance
    return response.data;
  },

  // toggle zone Active Status
  toggleZoneActiveStatus: async (zoneId, active) => {
        const response = await api.patch(`${API_BASE_URL}/${zoneId}`, { active });
        return response.data;
  },
  
  // Bulk toggle zone Active Status
  bulkToggleZoneActiveStatus: async (zoneIds, active) => {
    const response = await api.patch(API_BASE_URL, {
      zoneIds,
      active
    });
    return response.data;
  }
}