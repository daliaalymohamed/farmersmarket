import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import { RedisUtils, TTL } from '@/lib/utils/redis';
import Product from '@/models/product';
import Category from '@/models/category';
import Vendor from '@/models/vendor';


export const GET = async (req, { params }) => {
    console.log("🚀 GET /api/product/[slug] route hit!");
    
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

        // Check Redis cache first
        const cacheKey = `product:slug:${slug}`;
        try {
            const cached = await RedisUtils.getJSON(cacheKey);
            if (cached) {
                // console.log('🎯 Product cache hit');
                return NextResponse.json({ 
                    success: true, 
                    product: cached.product,
                    metadata: cached.metadata 
                }, { status: 200 });
            }
        } catch (cacheError) {
            console.warn('⚠️ Redis read failed:', cacheError.message);
        }

        const product = await Product.findOne({ slug, isActive: true })
            .populate('categoryId', 'name slug')
            .populate('vendorId', 'name')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .lean();

        if (!product) {
            return NextResponse.json({ 
                success: false, 
                error: 'Product not found' 
            }, { status: 404 });
        }

        // ✅ Calculate discount percentage
        let discountPercentage = 0;
        if (product.isOnSale && product.salePrice > 0) {
        discountPercentage = Math.round(
            ((product.price - product.salePrice) / product.price) * 100
        );
        }

        // ✅ Use structured clone to add field safely
        const productWithDiscountIfExisted = {
        ...product,
        discountPercentage // ← Add as new property
        };

        // Cache the product (30 minutes)
        // Generate metadata from product data
        const metadata = {
            title: `${product.name?.en || 'Product'} | Farmer's Market`,
            description: product.description?.en || `Buy fresh ${product.name?.en || 'products'} online with fast delivery.`,
            keywords: product.tags?.join(', ') || ''
        };

        // Cache product with metadata
        const cacheData = {
            product: productWithDiscountIfExisted,
            metadata: metadata
        };

        try {
            await RedisUtils.setJSON(cacheKey, cacheData, TTL.MINUTES(30));
            // console.log('💾 Product and metadata cached');
        } catch (cacheError) {
            console.warn('⚠️ Failed to cache product:', cacheError.message);
        }

        return NextResponse.json({ 
            success: true, 
            product: productWithDiscountIfExisted,
            metadata // Include metadata in response
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching product:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
};