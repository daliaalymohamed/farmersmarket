// This is server-side code for a Next.js page that fetches home data.import { getHomePageData } from '@/app/actions/home/serverFilteredProductsData';
import { Suspense } from 'react';
import { getHomePageData } from '@/app/actions/home/serverFilteredProductsData';
import HomePageSkeleton from '@/components/SKELETONS/homePageSkeleton';
import Home from './home';
import Error from '@/components/UI/error';


// ✅ Enable ISR: Revalidate every 60 seconds
// This allows the page to be statically regenerated in the background
// at most once every 60 seconds when a request comes in.
// "Rebuild this page at most once every 60 seconds when someone requests it"
export const revalidate = 60;

// ✅ Optional: For dynamic routes or preview
export async function generateStaticParams() {
  return [{},]; // Required if using layout groups or incremental generation
}

// ✅ Dynamic Metadata
export async function generateMetadata() {
  // Fetch home page data to get metadata
  const result = await getHomePageData();
  if (result.success && result.data?.metadata) {
    const meta = result.data.metadata;

    return {
      title: meta.title,
      description: meta.description,
      openGraph: { title: meta.title, description: meta.description }
    };
  }

  // Fallback means no data returned from meta data or error
  return {
    title: 'Farmer\'s Market | Fresh Products Delivered',
    description: 'Buy fresh dairy, bread, fruits & more online with fast delivery.',
  };
}


const HomePage = async () => {
  try {
    const result = await getHomePageData();

    if (!result.success) {
      return <Error error={result.error || 'Failed to load home data.'} />;
    }

    if (!result.data) {
      console.warn("⚠️ No data returned despite success");
      return <Error error="No content available" />;
    }

    return (
      <Suspense fallback={<HomePageSkeleton />}>
        <Home homeData={result.data} />
      </Suspense>
    );
  } catch (error) {
    console.error('🚨 Critical error in HomePage:', error);
    return <Error error="Unexpected rendering error." />;
  }
}

export default HomePage