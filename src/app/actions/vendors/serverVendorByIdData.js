'use server';

import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

// This is a server-side function to fetch vendors data
export const getVendorById = async (id) => {
  try {
    // Validate inputs
    if (!id?.trim()) {
      throw new Error('Vendor ID is required');
    }

    // Get authenticated user data and headers
    const { headers } = await getAuthenticatedUser();
    
    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }

    // Make the API request
    const response = await fetch(`${baseUrl}/api/vendors/${id}`, {
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
    console.info('[getVendorById] Error:', {
      message: error.message,
      type: error.name,
      id
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