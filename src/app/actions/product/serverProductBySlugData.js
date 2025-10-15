'use server';

import { redirect } from 'next/navigation';
import { RedisUtils } from '@/lib/utils/redis';

// This is a server-side function to fetch product data
export const getProductBySlug = async (slug) => {
  try {
    // Validate inputs
    if (!slug?.trim()) {
      throw new Error('Product Slug is required');
    }

    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }

    // 1. Create a STABLE cache key (sort the filters for consistency)
    const cacheKey = `product:slug:${slug.trim()}`;

    // 2. Attempt to get cached data from Redis with error handling
    // Try cache
    try {
      const cachedData = await RedisUtils.getJSON(cacheKey);
      if (cachedData) {
        console.log('✅ Cache hit! Returning cached data.');
        return {
          success: true,
          data: cachedData.product,
          metadata: cachedData.metadata, // Return cached metadata
          source: 'cache',
          timestamp: new Date().toISOString()
        };
      }
    } catch (cacheError) {
      console.warn('⚠️ Redis cache read failed:', cacheError.message);
    }

    // 3. Build the API URL
    const url = new URL(`${baseUrl}/api/product/${slug}`);    // console.log('🔄 Fetching home page data from:', url);

    // 4. Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout


    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('API request timed out');
      }
      throw new Error(`Network error: ${fetchError.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    // 5. Handle response status
    if (!response.ok) {
      switch (response.status) {
        case 401:
          redirect('/login');
        case 403:
          return { success: false, error: 'Access forbidden', status: 403 };
        case 404:
          return { success: false, error: 'Product page data not found', status: 404 };
        case 500:
          return { success: false, error: 'Server error', status: 500 };
        default:
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If we can't parse the error response, use the default message
          }
          throw new Error(errorMessage);
      }
    }

    // 6. Parse response
      let data;
      try {
        const responseData = await response.json();
        data = responseData;

      } catch (parseError) {
        throw new Error('Invalid JSON response from API');
      }
  
      // 7. Validate response structure
      if (!data.success || !data.product) {
        throw new Error('Invalid API response structure');
      }

      // 8. Return the fresh data
      return {
        success: true,
        data: data.product,
        metadata: data.metadata, 
        source: 'api',
        timestamp: new Date().toISOString()
      };
  
    } catch (error) {
      console.error('[getproductBySlug] Error:', {
        message: error.message,
        type: error.name,
        slug,
      });
  
      // Handle redirect errors (these are expected)
      if (error.message === 'NEXT_REDIRECT') {
        throw error; // Let Next.js handle the redirect
      }
  
      // Return a structured error response instead of throwing
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        source: 'error',
        timestamp: new Date().toISOString()
      };
    }
   
};
