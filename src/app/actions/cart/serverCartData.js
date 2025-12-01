'use server';

import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

// This is a server-side function to fetch cart Items data
export const getCartItems = async (filters) => {
  try {

    // Get authenticated user data and headers
    const { headers } = await getAuthenticatedUser();

    // If no auth headers, return empty cart early
    if (!headers['Authorization']) {
      return {
        cart: { items: [] },
        cartSuccess: true
      };
    }

    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }

    // Create URL with search parameters
    const url = new URL(`${baseUrl}/api/cart`);

    // Add all filters as search parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value.toString());
      }
    });

    // Make the API request without attaching auth headers
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    // Handle response
    const data = await response.json();

    switch (response.status) {
      case 200:
        return data;
      case 401:
      case 403:
        // Treat unauthorized as empty cart
        return {
          cart: { items: [] },
          cartSuccess: true
        };
      case 404:
        return {
          cart: { items: [] },
          cartSuccess: true
        };
      default:
        throw new Error(data.error || `API error: ${response.status}`);
    }
  } catch (error) {
    console.info('[getCartItems] Error:', {
      message: error.message,
      type: error.name,
    });

    // Handle redirect errors (these are expected)
    if (error.message === 'NEXT_REDIRECT') {
      throw error; // Let Next.js handle the redirect
    }
    
    if (error.name === 'TypeError') {
      throw new Error('Network or fetch configuration error');
    }
    
    throw error;
  }
};