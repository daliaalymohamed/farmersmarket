const API_BASE_URL = "/api/users"; // Next.js API Route
import { api } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const customersApi = {
  // fetchCustomers by filters
  fetchCustomers: async (filters) => {
    // Convert filters to query string
    const queryParams = new URLSearchParams();
    
    // Add all filter parameters
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.active) queryParams.append('status', filters.active === 'true' ? 'active' : 'inactive');
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    // Make the GET request with query parameters
    const response = await api.get(`${API_BASE_URL}?${queryParams.toString()}`);
    return response.data;
  },

  // toggleUserActiveStatus
  toggleUserActiveStatus: async (userId, isActive) => {
    const response = await api.patch(`${API_BASE_URL}/${userId}`, { active: isActive });
    return response.data;
  },

  // editProfile
  editProfile: async (userId, payload) => {
    const response = await api.put(`${API_BASE_URL}/${userId}`, payload);
    return response.data;
  }
};
