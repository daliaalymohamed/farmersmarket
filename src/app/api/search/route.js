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

        // Validate query
        if (!q || q.trim().length === 0) {
        return NextResponse.json({
            success: true,
            results: [],
            totalCount: 0,
            query: ''
        });
        }

        const index = client.index(searchIndex.ALL); // Use combined index

        // Perform search
        const searchResults = await index.search(q.trim(), {
        limit,
        attributesToRetrieve: [
            'id', 'type', 'name_en', 'name_ar', 'image',
            'price', 'salePrice', 'stock', 'isActive', 'slug'
        ],
        attributesToHighlight: ['name_en'],
        filter: undefined
        });

        // Format hits        
        const results = searchResults.hits.map(hit => ({
            ...hit,
            imageUrl: hit.image ? `${process.env.NEXT_PUBLIC_BASE_URL}${hit.image}` : null,
            // Add navigation path
            href: hit.type === 'product' 
                ? `/product/${hit.slug}` 
                : `/category/${encodeURIComponent(hit.name_en)}`
        }));

        return NextResponse.json({
            success: true,
            query: q.trim(),
            results,
            totalCount: searchResults.estimatedTotalHits,
            offset: searchResults.offset,
            limit: searchResults.limit
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