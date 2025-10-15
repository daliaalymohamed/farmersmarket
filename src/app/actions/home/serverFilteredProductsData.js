// actions/home/serverFilteredProductsData.js
'use server';

import { redirect } from 'next/navigation';
import { RedisUtils } from '@/lib/utils/redis';

/**
 * Fetches homepage data with hybrid caching:
 * - Categories cached 6 hours
 * - Best Sellers IDs cached 30 minutes
 * - Product facets cached 30 minutes
 * - Composite page cached 30 minutes (optional)
 */
export const getHomePageData = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      return {
        success: false,
        error: 'API URL is not configured'
      };
    }

    // 🟡 Primary composite cache (fastest path – 30 min)
    const compositeCacheKey = 'homepage:main:static';
    try {
      const cachedData = await RedisUtils.getJSON(compositeCacheKey);
      if (cachedData) {
        console.log('✅ Composite cache hit: Returning full homepage data');
        return {
          success: true,
          data: cachedData,
          metadata: cachedData.metadata,
          source: 'cache',
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('⚠️ Redis composite cache read failed:', err.message);
    }

    // 🔍 If full cache missed, try loading individual pieces from Redis first
    let categories = null;
    let products = null;

    // ✅ Try cached categories (6-hour TTL)
    try {
      const cachedCats = await RedisUtils.getJSON('categories:all');
      if (cachedCats && Array.isArray(cachedCats)) {
        categories = cachedCats;
        // console.log('✅ Categories loaded from Redis cache');
      }
    } catch (err) {
      console.warn('⚠️ Failed to load categories from Redis:', err.message);
    }

    // ✅ Try cached product facets (30-minute TTL)
    try {
      const cachedProds = await RedisUtils.getJSON('home:products:result:10'); // limit=10
      if (cachedProds && typeof cachedProds === 'object') {
        products = cachedProds;
        // console.log('✅ Product sections loaded from Redis cache');
      }
    } catch (err) {
      console.warn('⚠️ Failed to load product facets from Redis:', err.message);
    }

    // To track if we fetched from API
    let apiData;

    // 🚀 Only call API if we’re missing any critical data
    if (!categories || !products) {
      console.log('❌ Partial cache miss. Fetching from /api/home');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      let response;
      try {
        response = await fetch(`${baseUrl}/api/home`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Fetch timeout');
          return { success: false, error: 'Request timed out' };
        }
        console.error('Network error:', fetchError);
        return { success: false, error: 'Network error' };
      } finally {
        clearTimeout(timeoutId);
      }

      // Handle HTTP status
      if (!response.ok) {
        switch (response.status) {
          case 401:
            redirect('/login');
          case 403:
            return { success: false, error: 'Access forbidden', status: 403 };
          case 404:
            return { success: false, error: 'Page not found', status: 404 };
          case 500:
            return { success: false, error: 'Server error', status: 500 };
          default: {
            const fallback = `API error: ${response.status}`;
            try {
              const errData = await response.json();
              return { success: false, error: errData.error || fallback };
            } catch {
              return { success: false, error: fallback };
            }
          }
        }
      }

      // Parse JSON safely
      try {
        apiData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse /api/home response:', parseError);
        return { success: false, error: 'Invalid JSON from API' };
      }

      // Validate structure
      if (!apiData?.success || !apiData?.data) {
        console.warn('Invalid API response structure:', apiData);
        return { success: false, error: 'Invalid API structure' };
      }

      // Update missing parts
      if (!categories && Array.isArray(apiData.data.categories)) {
        categories = apiData.data.categories;
      }
      if (!products && typeof apiData.data.products === 'object') {
        products = apiData.data.products;
      }
    }

    // ✅ Ensure both categories and products are available before proceeding
    if (!categories || !products) {
      console.error('Missing required data after fetch:', { categories, products });
      return { success: false, error: 'Incomplete data received' };
    }

    // ✅ Build final response
    const responseData = {
      products,
      categories,
      metadata: apiData?.data?.metadata
    };

    // 💾 Cache full result as optimization (30 minutes)
    try {
      await RedisUtils.setJSON(compositeCacheKey, responseData, 1800); // 30 min
      // console.log('💾 Full homepage result saved to Redis');
    } catch (err) {
      console.warn('⚠️ Failed to save composite cache:', err.message);
    }

    return {
      success: true,
      data: responseData,
      source: 'api',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[getHomePageData] Unexpected error:', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });

    // Allow redirects to propagate
    if (error.message === 'NEXT_REDIRECT') throw error;

    return {
      success: false,
      error: error.message || 'An unexpected error occurred while loading homepage',
      source: 'error',
      timestamp: new Date().toISOString()
    };
  }
};