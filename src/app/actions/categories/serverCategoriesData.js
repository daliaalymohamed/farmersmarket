'use server';

import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

// This is a server-side function to fetch categories data
export const getCategories = async (filters) => {
  try {

    // Get authenticated user data and headers
    const { headers } = await getAuthenticatedUser();
    
    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }


    // Create URL with search parameters
    const url = new URL(`${baseUrl}/api/categories`);
    // Add all filters as search parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value.toString());
      }
    });

    // Make the API request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    // Handle response
    const data = await response.json();

    // Response handling
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
    console.error('[getCategories] Error:', {
      message: error.message,
      type: error.name,
    });

    if (error.name === 'TypeError') {
      throw new Error('Network or fetch configuration error');
    }
    
    throw error;
  }
};