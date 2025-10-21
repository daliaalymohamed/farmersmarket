// app/api/search/route.js
import { NextResponse } from 'next/server';
import client from '@/lib/utils/meiliSearchClient';
import { searchIndex } from '@/lib/utils/meiliSearchClient';

export const GET = async (req) =>  {
    console.log("🚀 GET /api/search?q=... route hit!");
    try {
        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const type = searchParams.get('type'); // Optional: 'product' or 'category'

        // Validate query
        if (!q || q.trim().length === 0) {
            return NextResponse.json({
                success: true,
                results: [],
                totalCount: 0,
                query: ''
            });
        }

        // Validate limit
        if (limit < 1 || limit > 50) {
            return NextResponse.json({
                success: false,
                error: 'Limit must be between 1 and 50'
            }, { status: 400 });
        }


        const index = client.index(searchIndex.ALL); // Use combined index

        // ✅ Build conditional filter
        let filter = '';
        
        if (type === 'product') {
            // Products must have isActive = true
            filter = 'type = product AND isActive = true';
        } else if (type === 'category') {
            // Categories don't have isActive filter
            filter = 'type = category';
        } else {
            // Mixed search: products with isActive OR any category
            filter = '(type = product AND isActive = true) OR type = category';
        }

        /// Perform search
        const searchResults = await index.search(q.trim(), {
            limit,
            attributesToRetrieve: [
                'id', 'type', 'name_en', 'name_ar', 'image',
                'price', 'salePrice', 'stock', 'isActive', 'slug'
            ],
            attributesToHighlight: ['name_en', 'name_ar'],
            filter,
            sort: ['type:asc'] // Products first, then categories
        });

        // Format results
        const results = searchResults.hits.map(hit => ({
            id: hit.id,
            type: hit.type,
            name_en: hit.name_en,
            name_ar: hit.name_ar,
            slug: hit.slug,
            image: hit.image,
            ...(hit.type === 'product' && {
                price: hit.price,
                salePrice: hit.salePrice,
                stock: hit.stock
            }),
            href: hit.type === 'product' 
                ? `/product/${hit.slug}` 
                : `/category/${hit.slug}`
        }));

        return NextResponse.json({
            success: true,
            query: q.trim(),
            results,
            totalCount: searchResults.estimatedTotalHits,
            processingTimeMs: searchResults.processingTimeMs
        });


    } catch (error) {
        console.error('❌ Meilisearch error:', error.message);
        
        // Fallback: Return error without crashing
        return NextResponse.json(
        {
            success: false,
            error: 'Search service unavailable',
            results: []
        },
        { status: 500 }
        );
    }
}