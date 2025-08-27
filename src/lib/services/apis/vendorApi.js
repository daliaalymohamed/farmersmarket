const API_BASE_URL = "/api/vendors"; // Next.js API Route
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const vendorApi = {
  // Add a new vendor
  addVendor: async (vendorData) => {
    const response = await api.post(API_BASE_URL, vendorData); // Use apiInstance
    return response.data;
  },

  // Edit an existing vendor
  editVendor: async (vendorId, vendorData) => {
    const response = await api.put(`${API_BASE_URL}/${vendorId}`, vendorData); // Use apiInstance
    return response.data;
  },

  // toggle Vendor Active Status
  toggleVendorActiveStatus: async (vendorId, active) => {
      const response = await api.patch(`${API_BASE_URL}/${vendorId}`, { active });
      return response.data;
  },

  // Bulk toggle Vendor Active Status
  bulkToggleVendorActiveStatus: async (vendorIds, active) => {
  const response = await api.patch(API_BASE_URL, {
    vendorIds,
    active
  });
  return response.data;
}
  
}