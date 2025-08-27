'use server';

// This is a server-side function to fetch products data
export const getProductById = async (id) => {
  try {
    // Validate inputs
    if (!id?.trim()) {
      throw new Error('Product ID is required');
    }

    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }

    // Make the API request without attaching auth headers
    const response = await fetch(`${baseUrl}/api/products/${id}`, {
      method: 'GET',
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
    console.error('[getProductId] Error:', {
      message: error.message,
      type: error.name,
      id
    });

    if (error.name === 'TypeError') {
      throw new Error('Network or fetch configuration error');
    }

    throw error;
  }
};