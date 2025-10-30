// These are helper functions for cache invalidation using Redis and Next.js revalidation
// lib/utils/invalidation.js
import { getRedisClient, RedisUtils } from '@/lib/utils/redis';
import { revalidatePath } from 'next/cache';
import Product from '@/models/product';
import Category from '@/models/category';

export class CacheInvalidation {
  /**
   * Invalidate cache when a product is created/updated/toggled
   */
  static async invalidateProductCache(productId, productSlug, categoryId, action = 'update') {
    try {
      const client = await getRedisClient();

      console.log(`🔄 Invalidating caches for product: ${productSlug} (${action})`);

      // 🔴 Delete exact-match product cache by slug
      await client.del(`product:slug:${productSlug}`);

      // 🔴 Clear related products (by category + exclude)
      if (categoryId) {
        // Delete any related product list containing this product
        await RedisUtils.delByPattern(`product:category:${categoryId}:*`);
      }

      // 🔴 Clear homepage sections
      await client.del('home:main:10');
      await client.del('home:main:20');
      await client.del('bestSellers:ids');
      await client.del('categories:all');

      // 🟡 Publish event
      await client.publish('product:invalidate', JSON.stringify({
        productId,
        productSlug,
        categoryId,
        action,
        timestamp: new Date().toISOString()
      }));

      // ✅ Resolve category slug
      let categorySlug = null;
      if (categoryId) {
        try {
          const category = await Category.findById(categoryId).select('slug').lean();
          categorySlug = category?.slug || null;
        } catch (err) {
          console.warn('⚠️ Failed to resolve category slug:', err.message);
        }
      }

      // ✅ Revalidate Next.js paths
      const pathsToRevalidate = [
        '/',
        '/home',
        `/product/${productSlug}`,
        '/dashboard/products/list'
      ];

      if (categorySlug) {
        pathsToRevalidate.push(`/category/${categorySlug}`);
      }

      try {
        pathsToRevalidate.forEach(path => revalidatePath(path));
      } catch {
        await this.triggerHttpRevalidation(pathsToRevalidate);
      }

      console.log(`✅ All caches invalidated for product: ${productSlug}`);

    } catch (error) {
      console.error('❌ Cache invalidation failed:', error.message);
    }
  }

  /**
   * Bulk invalidate many products (e.g., bulk toggle)
   */
  static async invalidateBulkProductCache(productIds, action = 'bulk_update') {
    try {
      const client = await getRedisClient();

      console.log(`🔄 Bulk invalidating ${productIds.length} products`);

      // Fetch full product data to get slugs and categories
      const products = await Promise.all(
        productIds.map(id =>
          Product.findById(id).select('slug categoryId').lean().catch(() => null)
        )
      );

      const slugs = products.filter(Boolean).map(p => p.slug);
      const categoryIds = [...new Set(products.filter(Boolean).map(p => p.categoryId?.toString()))];

      // 🔴 Delete individual product caches
      const delPromises = slugs.map(slug => client.del(`product:slug:${slug}`));
      await Promise.all(delPromises);

      // 🔴 Clear related products for affected categories
      for (const catId of categoryIds) {
        if (catId) {
          await RedisUtils.delByPattern(`product:category:${catId}:*`);
        }
      }

      // 🔴 Clear aggregated caches
      await client.del('home:main:10');
      await client.del('home:main:20');
      await client.del('bestSellers:ids');
      await client.del('categories:all');

      // 🟡 Notify system
      await client.publish('product:bulk_invalidate', JSON.stringify({
        productIds,
        count: productIds.length,
        action,
        timestamp: new Date().toISOString()
      }));

      // ✅ Revalidate pages
      const paths = ['/', '/home', '/dashboard/products/list'];
      try {
        paths.forEach(revalidatePath);
      } catch {
        await this.triggerHttpRevalidation(paths);
      }

      console.log(`✅ Bulk cache invalidated`);

    } catch (error) {
      console.error('❌ Bulk cache invalidation failed:', error.message);
    }
  }

  /**
   * Invalidate cache when category is updated or deleted
   */
  static async invalidateCategoryCache(categoryId, oldSlug = null) {
    try {
      const client = await getRedisClient();

      console.log(`🔄 Invalidating cache for category: ${categoryId}`);

      // Find current slug
      let categorySlug = oldSlug;
      if (!oldSlug) {
        try {
          const category = await Category.findById(categoryId).select('slug').lean();
          categorySlug = category?.slug || null;
        } catch (err) {
          console.warn('⚠️ Failed to fetch category slug:', err.message);
        }
      }

      // 🔴 Delete all variations of category page cache (paginated)
      if (categorySlug) {
        await RedisUtils.delByPattern(`category:slug:${categorySlug}:*`);
      }

      // 🔴 Clear related products lists
      await RedisUtils.delByPattern(`product:category:${categoryId}:*`);

      // 🔴 Clear homepage & global caches
      await client.del('home:main:10');
      await client.del('home:main:20');
      await client.del('categories:all');

      // 🟡 Notify system
      await client.publish('category:invalidate', JSON.stringify({
        categoryId,
        categorySlug,
        timestamp: new Date().toISOString()
      }));

      // ✅ Revalidate paths
      const paths = ['/', '/home'];
      if (categorySlug) {
        paths.push(`/category/${categorySlug}`);
      }

      try {
        paths.forEach(revalidatePath);
      } catch {
        await this.triggerHttpRevalidation(paths);
      }

      console.log(`✅ Category cache invalidated: ${categorySlug}`);

    } catch (error) {
      console.error('❌ Category cache invalidation failed:', error.message);
    }
  }

  /**
   * Fallback HTTP revalidation
   */
  static async triggerHttpRevalidation(paths) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
    const secret = process.env.REVALIDATE_SECRET;

    if (!secret || !baseUrl) {
      console.warn('⚠️ Revalidation skipped: missing env vars');
      return;
    }

    // Trigger Next.js revalidation
    await Promise.all(
      paths.map(async (path) => {
        try {
          const url = `${baseUrl}/api/revalidate?secret=${secret}&path=${encodeURIComponent(path)}`;
          await fetch(url, { method: 'GET', cache: 'no-store' });
          console.log(`✅ Revalidated: ${path}`);
        } catch (err) {
          console.error(`🚨 Failed to revalidate ${path}:`, err.message);
        }
      })
    );

    // Warm cache by pre-fetching
    // ✅ CACHE_WARMING_ENABLED can make responses feel much faster — especially after deploys. 
    /* 
      WITH CACHE WARMING 
        makes the system pre-generates that content before anyone visits
        Everyone gets fast response from the start
      WITHOUT CACHE WARMING
        leaves it to the first visitor to trigger regeneration
        Subsequent users get fast cached version 
    */
    if (process.env.CACHE_WARMING_ENABLED === 'true') {
      console.log('🔥 Cache warming enabled - fetching updated data...');
      
      await Promise.all(
        paths.map(async (path) => {
          try {
            const warmUrl = `${baseUrl}/api${path === '/' ? '/home' : path}`;
            const res = await fetch(`${warmUrl}?revalidate=true`, {
              method: 'GET',
              cache: 'no-store'
            });
            if (res.ok) {
              console.log(`🌡️ Warmed cache for: ${path}`);
            } else {
              console.warn(`❌ Warm-up failed for ${path}:`, res.status);
            }
          } catch (err) {
            console.error(`❌ Warm-up fetch error for ${path}:`, err.message);
          }
        })
      );
    }
  }
}