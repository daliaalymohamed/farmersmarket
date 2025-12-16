const API_BASE_URL = "/api/roles"; // Next.js API Route
import { api } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const roleApi = {
  // Add a new role
  addRole: async (roleData) => {
    const response = await api.post(API_BASE_URL, roleData); // Use apiInstance
    return response.data;
  },

  // Edit an existing role
  editRole: async (roleId, roleData) => {
    const response = await api.put(`${API_BASE_URL}/${roleId}`, roleData); // Use apiInstance
    return response.data;
  },

  // Assign action to role
  assignActionToRole: async (roleId, actionIds) => {
    const response = await api.put(`${API_BASE_URL}/${roleId}/assign-action`, { actionIds}); // Use apiInstance
    return response.data; 
  },

  // Remove action from role
  removeActionFromRole: async (roleId, actionIds) => {
    const response = await api.put(`${API_BASE_URL}/${roleId}/remove-action`, { actionIds}); // Use apiInstance
    return response.data; 
  }
}