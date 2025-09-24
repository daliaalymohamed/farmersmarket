// app/api/home/route.js 
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import { RedisUtils, TTL } from '@/lib/utils/redis';
import mongoose from 'mongoose';
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

export const GET = async (req) => {
  try {
    console.log("🚀 GET /api/home route hit!");

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 20);

    const mainCacheKey = `home:${search}:${category}:${limit}`;
    const bestSellersKey = 'bestSellers:ids';
    const categoriesKey = 'categories:all';

    // Try cache first
    try {
      const cachedData = await RedisUtils.getJSON(mainCacheKey);
      if (cachedData) {
        console.log('🎯 Cache hit');
        return NextResponse.json({
          success: true,
          data: {
            ...cachedData,
            metadata: { ...cachedData.metadata, cached: true }
          }
        });
      }
    } catch (err) {
      console.warn('Redis read failed:', err.message);
    }

    await connectToDatabase();

    // Base match
    const baseMatch = {
      isActive: true,
      stock: { $gt: 0 },
      ...(search && {
        $or: [
          { 'name.en': { $regex: search, $options: 'i' } },
          { 'name.ar': { $regex: search, $options: 'i' } },
          { 'description.en': { $regex: search, $options: 'i' } },
          { 'description.ar': { $regex: search, $options: 'i' } }
        ]
      }),
      ...(category && { categoryId: new mongoose.Types.ObjectId(category) })
    };

    // Best sellers
    let bestSellerIds = [];
    try {
      const cached = await RedisUtils.getJSON(bestSellersKey);
      if (cached) {
        bestSellerIds = cached;
      } else {
        const result = await Order.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.productId', totalSold: { $sum: '$items.quantity' } } },
          { $sort: { totalSold: -1 } },
          { $limit: 50 }
        ]);
        bestSellerIds = result.map(r => r._id);
        await RedisUtils.setJSON(bestSellersKey, bestSellerIds, TTL.MINUTES(30)); // overide to 30 minutes instead of 1 hour "The default is 3600 seconds (1 hour)"
      }
    } catch (err) {
      console.warn('Best sellers failed:', err.message);
    }

    // Categories
    let categories = [];
    try {
      const cached = await RedisUtils.getJSON(categoriesKey);
      if (cached) {
        categories = cached;
      } else {
        categories = await Category.find({})
          .select('name image color')
          .lean();
        await RedisUtils.setJSON(categoriesKey, categories, TTL.HOURS(6)); // overide to 6 hours instead of 1 hour "The default is 3600 seconds (1 hour)"
      }
    } catch (err) {
      console.error('Categories fetch failed:', err);
    }

    // ✅ Use the external helper
    const productPipeline = [
      { $match: baseMatch },
      {
        $facet: {
          topDeals: [
            {
              $match: {
                isOnSale: true,
                salePrice: { $gt: 0 },
                $expr: { $gt: ["$price", "$salePrice"] }
              }
            },
            { $sort: { isFeatured: -1, createdAt: -1 } },
            { $limit: limit },
            ...getProductProjectionStages() // ✅ Now safe
          ],
          newArrivals: [
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            ...getProductProjectionStages()
          ],
          bestSellers: [
            {
              $match: bestSellerIds.length > 0
                ? { _id: { $in: bestSellerIds } }
                : { isFeatured: true }
            },
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

    /*************** DEBUG LOGS ***************** */
    // const debugTopDeals = await Product.aggregate([
    //   {
    //     $match: {
    //       isOnSale: true,
    //       salePrice: { $gt: 0 },
    //       $expr: { $gt: ["$price", "$salePrice"] }
    //     }
    //   },
    //   { $count: "total" }
    // ]).then(res => res[0]?.total || 0);

    // console.log('✅ Total valid topDeals:', debugTopDeals);

    // const allOnSale = await Product.find({
    //   isOnSale: true,
    //   salePrice: { $gt: 0 }
    // }).select('_id name price salePrice saleStart saleEnd').lean();

    // console.log('🛒 All on-sale products:', allOnSale.map(p => ({
    //   id: p._id,
    //   name: p.name?.en || 'Unnamed',
    //   price: p.price,
    //   salePrice: p.salePrice,
    //   saleStart: p.saleStart,
    //   saleEnd: p.saleEnd,
    //   validDiscount: p.price > p.salePrice
    // })));
    /****************************************************** */

    let aggregationResult;
    try {
      // console.log('🔍 Executing aggregation pipeline...');
      aggregationResult = await Product.aggregate(productPipeline).exec();
      // console.log('📦 Raw Aggregation Result:', JSON.stringify(aggregationResult, null, 2));
    } catch (aggError) {
      console.error('❌ Aggregation failed:', aggError);
      aggregationResult = [];
    }

    const facetResult = Array.isArray(aggregationResult) && aggregationResult.length > 0 ? aggregationResult[0] : {};

    const safeResult = {
      topDeals: Array.isArray(facetResult.topDeals) ? facetResult.topDeals : [],
      newArrivals: Array.isArray(facetResult.newArrivals) ? facetResult.newArrivals : [],
      bestSellers: Array.isArray(facetResult.bestSellers) ? facetResult.bestSellers : [],
      featured: Array.isArray(facetResult.featured) ? facetResult.featured : []
    };

    console.log('📈 Section counts:', {
      topDeals: safeResult.topDeals.length,
      newArrivals: safeResult.newArrivals.length,
      bestSellers: safeResult.bestSellers.length,
      featured: safeResult.featured.length
    });

    const responseData = {
      products: safeResult,
      categories,
      metadata: {
        search,
        category,
        limit,
        timestamp: new Date().toISOString(),
        cached: false,
        bestSellersCount: bestSellerIds.length
      }
    };

    try {
      await RedisUtils.setJSON(mainCacheKey, responseData, TTL.MINUTES(30)); // overide to 30 minutes instead of 1 hour "The default is 3600 seconds (1 hour)"
    } catch (err) {
      console.warn('Failed to cache home data:', err.message);
    }

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error('❌ Error in /api/home:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};