// app/api/category/[slug]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import { RedisUtils, TTL } from '@/lib/utils/redis';
import Product from '@/models/product';
import Category from '@/models/category';
import mongoose from 'mongoose'; 

export const GET = async (req, { params }) => {
  console.log("🚀 GET /api/category/[slug] route hit!");

  try {
    // Connect to the database
    await connectToDatabase();

    // Validate and extract slug
    const { slug } = await params;
    
    if (!slug) {
        return NextResponse.json({ 
            success: false, 
            error: 'Slug is required' 
        }, { status: 400 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = parseInt(searchParams.get('limit') || '3', 10);
    const skip = (page - 1) * limit;

    // Build cache key
    const cacheKey = `category:slug:${slug}:page:${page}:limit:${limit}`;

    // Check Redis cache first
    try {
      const cached = await RedisUtils.getJSON(cacheKey);
      if (cached) {
        // console.log('🎯 Cache hit for category:', slug);
        return NextResponse.json({ 
            success: true, 
            category: cached.category,
            products: cached.products,
            pagination: cached.pagination,
            metadata: cached.metadata
        }, { status: 200 });
      }
    } catch (err) {
      console.warn('Redis read failed:', err.message);
    }

    /// Find current category by slug
    const category = await Category.findOne({ slug })
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build MongoDB query to get all category related products
    //     1. Same categoryId
    //     2. isActive true
    //     3. stock > 0
    //     4. limit to 8 results
    const query = {
      categoryId: new mongoose.Types.ObjectId(category._id),
      isActive: true,
      stock: { $gt: 0 }
    };

    // Fetch total count
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch paginated products
    const productDocs = await Product.find(query)
      .select('name price salePrice image slug stock isOnSale')
      .populate('categoryId', 'name.en name.ar slug')
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit + 1) // Get one extra to detect "hasNextPage"
      .lean();

    // Add discountPercentage before sending
    const productsWithDiscount = productDocs.map(product => {
      let discountPercentage = 0;
      if (product.isOnSale && product.salePrice > 0) {
        discountPercentage = Math.round(
          ((product.price - product.salePrice) / product.price) * 100
        );
      }
      return { ...product, discountPercentage };
    });
    
    const hasNextPage = productsWithDiscount.length > limit;
    const products = hasNextPage ? productsWithDiscount.slice(0, -1) : productsWithDiscount;

    // Cache the category (6 hours)
    // Generate metadata from product data
    const metadata = {
        title: `${category.name?.en || 'Category'} | Farmer's Market`,
    };

    if (!productDocs.length) {
      return NextResponse.json({
        success: true,
        category, 
        products: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1
        },
        metadata
      }, { status: 200 });
    }
    
    // 💾 Data to cache and return
    const cacheData = {
      category,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage: page > 1
      },
      metadata
    };

    try {
            await RedisUtils.setJSON(cacheKey, cacheData, TTL.HOURS(6));
            // console.log('💾 Category and metadata cached');
    } catch (cacheError) {
            console.warn('⚠️ Failed to cache category:', cacheError.message);
    }

    return NextResponse.json({ 
        success: true, 
        category,
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage: page > 1
        },
        metadata
    }, 
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};