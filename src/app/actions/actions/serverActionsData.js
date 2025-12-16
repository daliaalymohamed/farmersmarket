'use server';

import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

// This is a server-side function to fetch actions data
export const getActions = async () => {
  try {
    // Get authenticated user data and headers
    const { headers } = await getAuthenticatedUser();

    // If no auth headers, return empty roles early
    if (!headers || !headers['Authorization']) {
      return {
        roles: [],
        success: true
      };
    }

    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      return { roles: [], success: false, error: 'API configuration error' };

    }

    // Create URL with search parameters
    const url = new URL(`${baseUrl}/api/actions`);
    
    // Make the API request with auth headers
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
      case 404:
        return {
          actions: [],       // ✅ Empty array
          success: true,   // ✅ Still successful (just no results)
          message: 'No actions found'
        };
      case 401:
        throw new Error('Unauthorized access');
      case 403:
        throw new Error('Forbidden access');
      default:
        throw new Error(data.error || `API error: ${response.status}`);
    }
  } catch (error) {
    console.info('[getActions] Error:', {
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