// This is a server-side function to fetch customers data
import { getServerSideAuthHeaders } from '@/middlewares/backend_helpers';

export async function getCustomerById(id) {
  try {
    if (!id) {
      throw new Error('Customer ID is required');
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }


    // Get authentication headers and cookies
    const headers = await getServerSideAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/users/${id}`,
      {
        headers: headers,
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    );

      // Parse response first
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Server-side fetch error:', error);
    // Enhance error message based on error type
    if (error.name === 'TypeError') {
      throw new Error('Network or fetch configuration error');
    }
    throw error;
  }
}