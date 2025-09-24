// This is server-side code for a Next.js page that fetches home data.import { getHomePageData } from '@/app/actions/home/serverFilteredProductsData';
import { Suspense } from 'react';
// import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import { getHomePageData } from '@/app/actions/home/serverFilteredProductsData';
import HomePageSkeleton from '@/components/SKELETONS/homePageSkeleton';
import Home from './home';
import Error from '@/components/UI/error';

const HomePage = async ({searchParams}) => {
  
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const params = await searchParams || {};
  const { search, category } = params;
  
  const initialFilters = {
    search: search || '',
    category: category || '',
    limit: 10
  };

  try {
    // const categories = await getCategories(initialFilters);
    const result = await getHomePageData(initialFilters);
    if (!result.success) {
      return <Error error={result.error || 'Failed to load home data.'} />;
    }

    // return <Home categories={categories} />;
    return (<Suspense fallback={<HomePageSkeleton />}>
        <Home 
          homeData={result.data}
          searchTerm={search || ''}
          selectedCategory={category || ''}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading Data:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default HomePage