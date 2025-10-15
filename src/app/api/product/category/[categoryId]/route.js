// app/api/product/category/[categoryId]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import { RedisUtils, TTL } from '@/lib/utils/redis';
import Product from '@/models/product';
import mongoose from 'mongoose'; 

export const GET = async (req, { params }) => {
  console.log('🚀 GET /api/product/category/[categoryId] - Fetch related products');

  try {
    // Connect to DB
    await connectToDatabase();

    // Extract categoryId from route
    const { categoryId } = await params;
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const excludeId = searchParams.get('exclude'); // To exclude current product

    // Build cache key (include filters for consistency)
    const cacheKey = `product:category:${categoryId.trim()}:exclude:${excludeId || 'none'}:limit:${limit}`;

    // Check Redis cache first
    try {
      const cached = await RedisUtils.getJSON(cacheKey);
      if (cached) {
        // console.log('🎯 Related products cache hit');
        return NextResponse.json({
          success: true,
          products: cached.products,
          count: cached.count,
          cached: true
        });
      }
    } catch (err) {
      console.warn('⚠️ Redis read failed:', err.message);
    }

    // Build MongoDB query to get all category related products
    //     1. Same categoryId
    //     2. isActive true
    //     3. stock > 0
    const query = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
      stock: { $gt: 0 }
    };

    // Exclude current product if provided
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    // Fetch products
    const products = await Product.find(query)
      .select('name price salePrice image slug stock isOnSale')
      .populate('categoryId', 'name.en name.ar slug')
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .lean();

    if (!products.length) {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0,
        message: 'No related products found'
      }, { status: 200 } );
    }

    // Cache result
    try {
      await RedisUtils.setJSON(cacheKey, { products, count: products.length }, TTL.MINUTES(30));
      // console.log('💾 Related products cached');
    } catch (err) {
      console.warn('⚠️ Failed to cache related products:', err.message);
    }

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      cached: false
    });

  } catch (error) {
    console.error('❌ Error fetching related products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
};