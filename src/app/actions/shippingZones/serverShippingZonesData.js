'use server';

import { getAuthenticatedUser } from '@/lib/auth/serverAuth';


// This is a server-side function to fetch zones data
export const getShippingZones = async (filters) => {
  try {

    // Get authenticated user data and headers
    const { headers } = await getAuthenticatedUser();
    
    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }

    // Create URL with search parameters
    const url = new URL(`${baseUrl}/api/shipping-zones`);
    // Add all filters as search parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value.toString());
      }
    });

    // Make the API request without authentication headers
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store'
    });

    // Handle response
    const data = await response.json();

    switch (response.status) {
      case 200:
        return data;
      case 404:
        return null;
      case 401:
        throw new Error('Unauthorized access');
      case 403:
        throw new Error('Forbidden access');
      default:
        throw new Error(data.error || `API error: ${response.status}`);
    }
  } catch (error) {
    console.info('[getShoppingZones] Error:', {
      message: error.message,
      type: error.name
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