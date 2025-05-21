const API_BASE_URL = "/api/users"; // Next.js API Route
import { apiWithoutAuth, api } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const authApi = {
  // login
  login: async (credentials) => {
    const response = await apiWithoutAuth.post(`${API_BASE_URL}/login`, credentials);
    // console.log("Login Response:", response);
    return response.data;
  },
  // Register
  register: async (userData) => {
    const response = await apiWithoutAuth.post(`${API_BASE_URL}/register`, userData);
    // console.log("Register Response:", response);
    return response.data.user;
  },
  // Check Auth
  verifyToken: async (token) => {
    try {
      const response = await api.get(`${API_BASE_URL}/check`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("Verify Token Response:", response);
      return response.data.user;
    } catch (error) {
      console.error("Error in verifyToken:", error.response?.data || error.message);
      throw error;
    }
  },
};