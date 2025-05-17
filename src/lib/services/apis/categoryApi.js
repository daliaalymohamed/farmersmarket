const API_BASE_URL = "/api/categories"; // Next.js API Route
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const categoryApi = {
  // Fetch all categories with translations for the selected locale
  getAllCategories: async (locale = "en") => {
    const response = await apiWithoutAuth.get(`${API_BASE_URL}?locale=${locale}`); // Use apiInstance
    return response.data;
  },

  // Create a new category
  createCategory: async (categoryData) => {
    const response = await api.post(API_BASE_URL, categoryData); // Use apiInstance
    return response.data;
  },
};