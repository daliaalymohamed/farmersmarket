const API_BASE_URL = "/api/categories"; // Next.js API Route
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const categoryApi = {
  // Add a new category
  addCategory: async (categoryData) => {
    const response = await api.post(API_BASE_URL, categoryData); // Use apiInstance
    return response.data;
  },

  // Edit an existing category
  editCategory: async (categoryId, categoryData) => {
    const response = await api.put(`${API_BASE_URL}/${categoryId}`, categoryData); // Use apiInstance
    return response.data;
  },

  // Delete an existing category
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`${API_BASE_URL}/${categoryId}`); // Use apiInstance
    return response.data; 
  }
}