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

  // toggle Product Active Status
  toggleProductActiveStatus: async (productId, isActive) => {
        const response = await api.patch(`${API_BASE_URL}/${productId}`, { isActive });
        return response.data;
  },
  
  // Bulk toggle Product Active Status
  bulkToggleProductActiveStatus: async (productIds, isActive) => {
    const response = await api.patch(API_BASE_URL, {
      productIds,
      isActive
    });
    return response.data;
  }
}