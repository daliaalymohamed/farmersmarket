// This is server-side code for a Next.js page that fetches home data.import { getProductBySlug } from '@/app/actions/product/serverProductBySlugData';
import { Suspense } from 'react';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import { getProductBySlug } from '@/app/actions/product/serverProductBySlugData';
import { getRelatedProducts} from '@/app/actions/product/serverRelatedCategoryProductsData';
import ProductPageSkeleton from '@/components/SKELETONS/productPageSkeleton';
import Product from './product';
import Error from '@/components/UI/error';


/** We’ll change it to use ISR with generateStaticParams so pages are:

✅ Pre-rendered at build time (or on-demand)
✅ Served from CDN
✅ Revalidated in background
✅ Fast & scalable
✅ First visitor after 60s → triggers background update
✅ Everyone else gets cached version
*/
/**
 * 
 Here’s what happens when a user visits /product/milk-bottle:

              STEP                                                      WHAT HAPPENS
1️⃣ Next.js checks if HTML is stale (revalidate=60)             If yes → starts regenerating page

2️⃣ During regeneration, it calls
getProductBySlug()                                             This hits your API or server action

3️⃣ Your API checks Redis first                                 If data is cached → return instantly

4️⃣ If not in Redis → fetch from MongoDB                        Then store in Redis for next time
5️⃣ Next.js builds new HTML and caches it                       Ready for next visitors
 */

/**  
 * ISR handles the "shell" (HTML)
*  Redis handles the "content" (data)
*/

// ✅ Enable ISR: Revalidate every 60 seconds
export const revalidate = 60;

// ✅ Generate static params for SSG/ISR
export async function generateStaticParams() {
  try {
    // Optional: Pre-generate top product slugs at build time
    // Or return empty array for pure on-demand generation
    return [];
  } catch {
    return [];
  }
}

// ✅ Dynamic Metadata
export async function generateMetadata({ params }) {
    const { slug } = await params;
    // Fetch home page data to get metadata
    const result = await getProductBySlug(slug);
    if (result.success && result.metadata) {
    // Metadata is at result.metadata, not result.data.metadata
        if (result.success && result.metadata) {
            const meta = result.metadata;
            return {
                title: meta.title,
                description: meta.description,
                openGraph: { 
                    title: meta.title, 
                    description: meta.description 
                }
            };
        }

        // Fallback means no data returned from meta data or error
        return {
            title: 'Product Not Found | Farmer\'s Market',
            description: 'This product could not be found.',
        };
    }
}

const ProductPage = async ({ params }) => {
    const { slug } = await params;
    try {
    const result = await getProductBySlug(slug);
    if (!result.success) {
      return <Error error={result.error || 'Failed to load product data.'} />;
    }

    if (!result.data) {
      console.warn("⚠️ No data returned despite success");
      return <Error error="No content available" />;
    }

    // Fetch categories to render at the top
    const categoriesResult = await getCategories({});
    if (!categoriesResult?.success) {
      console.warn("⚠️ Categories fetch failed");
    }
    const categories = Array.isArray(categoriesResult?.categories)
      ? categoriesResult.categories
      : [];

    // Fetch related products
    const product = result.data;

    // Fetch related products only if category exists
    const relatedResult = await getRelatedProducts(
      product.categoryId?._id,
      product._id
    );

    const relatedProducts = Array.isArray(relatedResult?.data)
      ? relatedResult.data
      : [];

    return (
      <Suspense fallback={<ProductPageSkeleton />}>
        <Product productData={result.data} relatedProducts={relatedProducts} categories={categories}/>
      </Suspense>
    );
  } catch (error) {
    console.error('🚨 Critical error in Product Page:', error);
    return <Error error="Unexpected rendering error." />;
  } 
};

export default ProductPage;