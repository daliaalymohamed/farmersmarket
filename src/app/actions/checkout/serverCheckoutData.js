// app/actions/checkout/serverCheckoutData.js
'use server';

import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

// This is a server-side function to fetch checkout data
export const getCheckoutData = async () => {
  try {
    const { headers } = await getAuthenticatedUser();

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) throw new Error('API URL not configured');

    const url = `${baseUrl}/api/checkout`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    const data = await response.json();

    switch (response.status) {
      case 200:
        return { success: true, data };
      case 401:
      case 403:
        return { success: false, error: 'Unauthorized' };
      default:
        return { success: false, error: data.error || 'Failed to load checkout data' };
    }
  } catch (error) {
    console.info('[getCheckoutData] Error:', {
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