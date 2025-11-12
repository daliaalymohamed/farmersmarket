// lib/services/apis/cartApi.js
const API_BASE_URL = "/api/cart"; // Next.js API Route
import { api, apiWithoutAuth } from "@/lib/utils/apiInstance"; // Import your custom Axios instance

export const cartApi = {
    // add item to cart
    addItemToCart: async (itemData) => {
        const response = await api.post(API_BASE_URL, itemData); // Use apiInstance
        return response.data;
    },
    // Remove item from cart
    removeItemFromCart: async (productId) => {
        const response = await api.delete(`${API_BASE_URL}?productId=${productId}`); // Use apiInstance
        return response.data;
    }
};