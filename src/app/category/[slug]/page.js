// This is server-side code for a Next.js page that fetches home data.import { getCategoryRelatedProductsPaginated } from '@/app/actions/catefory/serverCategoryWithRelatedProducts';
import { Suspense } from 'react';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import { getCategoryRelatedProductsPaginated} from '@/app/actions/category/serverCategoryWithRelatedProducts';
import CategoryPageSkeleton from '@/components/SKELETONS/categoryPageSkeleton';
import Category from './category';
import Error from '@/components/UI/error';

// ✅ Enable ISR: Revalidate every 60 seconds
export const revalidate = 60;

// ✅ Generate static params for SSG/ISR
export async function generateStaticParams() {
  try {
    // Optional: Pre-generate top category slugs at build time
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
    const result = await getCategoryRelatedProductsPaginated(slug, { page: 1, limit: 8 });
    if (result.success && result.metadata) {
    // Metadata is at result.metadata, not result.data.metadata
        if (result.success && result.metadata) {
            const meta = result.metadata;
            return {
                title: meta.title,
                openGraph: { 
                    title: meta.title, 
                }
            };
        }

        // Fallback means no data returned from meta data or error
        return {
            title: 'Category Not Found | Farmer\'s Market',
        };
    }
}

const CategoryPage = async ({ params, searchParams }) => {
    const { slug } = await params;
    // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { page, limit } = await searchParams || {};

  const initialFilters = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 3,
  };

  // Validate numbers
  if (isNaN(initialFilters.page)) initialFilters.page = 1;
  if (isNaN(initialFilters.limit)) initialFilters.limit = 3;

    try {
    const result = await getCategoryRelatedProductsPaginated(slug, initialFilters);

    if (!result.success) {
      return <Error error={result.error || 'Failed to load related products data.'} />;
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


    return (
      <Suspense fallback={<CategoryPageSkeleton />}>
        <Category 
            relatedProducts={result.data} 
            categories={categories}
            category={result.category}
            pagination={result.pagination} />
      </Suspense>
    );
  } catch (error) {
    console.error('🚨 Critical error in Product Page:', error);
    return <Error error="Unexpected rendering error." />;
  } 
};

export default CategoryPage;