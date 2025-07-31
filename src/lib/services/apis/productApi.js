const API_BASE_URL = "/api/products"; // Next.js API Route
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const productApi = {
  // Add a new product
  addProduct: async (productData) => {
    const response = await api.post(API_BASE_URL, productData); // Use apiInstance
    return response.data;
  },

  // Edit an existing product
  editProduct: async (productId, productData) => {
    const response = await api.put(`${API_BASE_URL}/${productId}`, productData); // Use apiInstance
    return response.data;
  },

  // Delete an existing product
  deleteProduct: async (productId) => {
    const response = await api.delete(`${API_BASE_URL}/${productId}`); // Use apiInstance
    return response.data; 
  }
}