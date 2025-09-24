// actions/home/serverFilteredProductsData.js - CORRECTED VERSION
'use server';

import { redirect } from 'next/navigation';
import { RedisUtils } from '@/lib/utils/redis';

export const getHomePageData = async (filters = {}) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

    if (!baseUrl) {
      throw new Error('API URL is not configured');
    }

    // 1. Create a STABLE cache key (sort the filters for consistency)
    const normalizedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          result[key] = filters[key];
        }
        return result;
      }, {});

    const cacheKey = `homepage:${JSON.stringify(normalizedFilters)}`;
    // console.log('🔍 Checking cache for key:', cacheKey);

    // 2. Attempt to get cached data from Redis with error handling
    try {
      const cachedData = await RedisUtils.getJSON(cacheKey);

      if (cachedData) {
        console.log('✅ Cache hit! Returning cached data.');
        return {
          success: true,
          data: cachedData,
          source: 'cache',
          timestamp: new Date().toISOString()
        };
      }
    } catch (cacheError) {
      console.warn('⚠️ Redis cache read failed, proceeding with API call:', cacheError.message);
    }

    // console.log('❌ Cache miss. Fetching from API.');

    // 3. Build the API URL
    const searchParams = new URLSearchParams();
    
    Object.entries(normalizedFilters).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });

    const url = `${baseUrl}/api/home${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    // console.log('🔄 Fetching home page data from:', url);

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
          return { success: false, error: 'Home page data not found', status: 404 };
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
    if (!data.success || !data.data) {
      throw new Error('Invalid API response structure');
    }

    // 8. Cache the successful response with error handling
    try {
      await RedisUtils.setJSON(cacheKey, data.data, 1800); // 30 minutes
      // console.log('💾 Data cached in Redis with key:', cacheKey);
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache data in Redis:', cacheError.message);
      // Don't fail the request if caching fails
    }

    // 9. Return the fresh data
    return {
      success: true,
      data: data.data,
      source: 'api',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[getHomePageData] Error:', {
      message: error.message,
      type: error.name,
      filters,
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