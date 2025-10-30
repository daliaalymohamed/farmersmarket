// app/api/home/route.js 
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import { RedisUtils, TTL } from '@/lib/utils/redis';
import { syncData as syncToMeili} from '@/lib/utils/syncToMeili';
import Product from '@/models/product';
import Category from '@/models/category';
import Order from '@/models/order';

// ✅ Move this OUTSIDE of GET handler
export function getProductProjectionStages() {
  return [
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $addFields: {
        vendor: { $arrayElemAt: ['$vendor', 0] },
        category: { $arrayElemAt: ['$category', 0] }
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        price: 1,
        salePrice: 1,
        image: 1,
        images: { $slice: ['$images', 3] },
        stock: 1,
        isFeatured: 1,
        isOnSale: 1,
        saleStart: 1,
        saleEnd: 1,
        tags: { $slice: ['$tags', 5] },
        createdAt: 1,
        slug: 1,
        rating: 1,
        reviewCount: 1,
        vendor: 1,
        category: 1,
        discountPercentage: {
          $cond: {
            if: { $and: [{ $gt: ['$salePrice', 0] }, { $gt: ['$price', '$salePrice'] }] },
            then: {
              $round: [
                { $multiply: [{ $divide: [{ $subtract: ['$price', '$salePrice'] }, '$price'] }, 100] },
                0
              ]
            },
            else: 0
          }
        }
      }
    }
  ];
}

// At top of file
let hasSynced = false;


export const GET = async (req) => {
  console.log("🚀 GET /api/home route hit!");

  // Parse URL
  const { searchParams } = new URL(req.url);

  // ✅ Detect if this request is for revalidation
  const isRevalidating = searchParams.get('revalidate') === 'true' || 
            req.headers.get('x-next-revalidate') !== null;
                        
  // In development, sync Meilisearch on first request
  if (process.env.NODE_ENV === 'development' && !hasSynced) {
    await syncToMeili(); 
    hasSynced = true;
  }

  try {
    // Connect to the database
    await connectToDatabase();

    const limit = 10;
    const mainCacheKey = `home:main:${limit}`;
    const bestSellersKey = 'bestSellers:ids';
    const categoriesKey = 'categories:all';

    // Try full response cache first (fastest)
    let fullCached = null;
    if (!isRevalidating) {
      console.log('🔍 Checking full homepage cache');
      try {
        fullCached = await RedisUtils.getJSON(mainCacheKey);
        if (fullCached) {
        // console.log('🎯 Full homepage cache hit');
          return NextResponse.json({
            success: true,
            data: {
              ...fullCached,
              metadata: { ...fullCached.metadata, cached: true }
            }
          });
        }
      } catch (err) {
        console.warn('❌ Redis full cache read failed:', err.message);
      }

    } else {
      console.log('🔄 Skipping cache: revalidation in progress');
    }

    // If full cache missed, try partials (categories + best sellers)
    let categories, bestSellerIds;

    // ✅ Load categories (cached 6h)
    try {
      const cachedCats = await RedisUtils.getJSON(categoriesKey);
      if (cachedCats) {
        categories = cachedCats;
        // console.log('✅ Categories loaded from Redis');
      } else {
        categories = await Category.find({}).select('name image color slug').lean();
        await RedisUtils.setJSON(categoriesKey, categories, TTL.HOURS(6));
        // console.log('💾 Categories saved to Redis');
      }
    } catch (err) {
      console.error('Categories fetch failed:', err);
      categories = [];
    }

    // ✅ Load best seller IDs (cached 30m)
    try {
      const cachedBs = await RedisUtils.getJSON(bestSellersKey);
      if (cachedBs) {
        bestSellerIds = cachedBs;
        // console.log('✅ Best seller IDs loaded from Redis');
      } else {
        const result = await Order.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.productId', totalSold: { $sum: '$items.quantity' } } },
          { $sort: { totalSold: -1 } },
          { $limit: 50 }
        ]);
        bestSellerIds = result.map(r => r._id);
        await RedisUtils.setJSON(bestSellersKey, bestSellerIds, TTL.MINUTES(30));
        // console.log('💾 Best seller IDs saved to Redis');
      }
    } catch (err) {
      console.warn('Best sellers failed:', err.message);
      bestSellerIds = [];
    }


    // Run product aggregation only if needed
    let productsResult;
    const productCacheKey = `home:products:result:${limit}`;

    try {
      const cachedProducts = await RedisUtils.getJSON(productCacheKey);
      if (cachedProducts) {
        productsResult = cachedProducts;
        // console.log('✅ Products loaded from partial cache');
      } else {
        const productPipeline = [
          { $match: { isActive: true, stock: { $gt: 0 } } },
          {
            $facet: {
              topDeals: [{ $match: { isOnSale: true } }, { $sort: { saleEnd: -1 } }, { $limit: limit }, ...getProductProjectionStages() ], 
              newArrivals: [{ $sort: { createdAt: -1 } }, { $limit: limit }, ...getProductProjectionStages()],
              bestSellers: [
                { $match: bestSellerIds.length ? { _id: { $in: bestSellerIds } } : { isFeatured: true } },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                ...getProductProjectionStages()
              ],
              featured: [
                { $match: { isFeatured: true } },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                ...getProductProjectionStages()
              ]
            }
          }
        ];

        const result = await Product.aggregate(productPipeline).exec();
        productsResult = result[0] || {};

        // Cache just the product facet result
        await RedisUtils.setJSON(productCacheKey, productsResult, TTL.MINUTES(30));
        // console.log('💾 Products saved to Redis');
      }
    } catch (err) {
      console.error('Product aggregation failed:', err);
      productsResult = {};
    }

    // Build final response
    const safeResult = {
      topDeals: Array.isArray(productsResult.topDeals) ? productsResult.topDeals : [],
      newArrivals: Array.isArray(productsResult.newArrivals) ? productsResult.newArrivals : [],
      bestSellers: Array.isArray(productsResult.bestSellers) ? productsResult.bestSellers : [],
      featured: Array.isArray(productsResult.featured) ? productsResult.featured : []
    };

    const responseData = {
      products: safeResult,
      categories,
      metadata: {
        title: 'Farmer\'s Market | Fresh Products Delivered',
        description: 'Buy fresh dairy, bread, fruits & more online with fast delivery.',
        timestamp: new Date().toISOString(),
        cached: false
      }
    };

    // Save full response back to cache (30 min)
    try {
      await RedisUtils.setJSON(mainCacheKey, responseData, TTL.MINUTES(30));
    } catch (err) {
      console.warn('Failed to cache full homepage:', err.message);
    }

    // Return response with CDN caching headers
    // CDNs should cache it for 60 seconds.
    // After that, they can keep showing the old version for up to 5 more minutes
    // while silently updating it in the background." 
    return NextResponse.json(
      { 
        success: true, 
        data: responseData 
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' // ✅ CDN caching
        }
      }
    );

  } catch (error) {
    console.error('❌ Error in /api/home:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};