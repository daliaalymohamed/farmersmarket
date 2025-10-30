'use client';
import { lazy, Suspense } from 'react';
import { Box, Divider } from '@mui/material';
import HeaderBoxSkeleton from '@/components/SKELETONS/headerBoxSkeleton';
import CategorySliderSkeleton from '@/components/SKELETONS/categorySliderSkeleton';
import FeaturedProductsSkeleton from '@/components/SKELETONS/featuredProductsSkeleton';
import DealsSliderSkeleton from '@/components/SKELETONS/dealsSliderSkeleton';
import BestSellersSkeleton from '@/components/SKELETONS/bestSellersSkeleton';
import NewArrivalsSkeleton from '@/components/SKELETONS/newArrivalsSkeleton';
const HeaderBox = lazy(() => import('@/components/headerBox'));
const CategorySlider = lazy(() => import('@/components/categorySlider'));
const FeaturedProducts = lazy(() => import('@/components/featuredProducts'));
const DealsSlider = lazy(() => import('@/components/dealsSlider'));
const BestSellers = lazy(() => import('@/components/bestSellers'));
const NewArrivals = lazy(() => import('@/components/newArrivals'));
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";

const Home  = ({homeData }) => {
  
  // Step 1: If homeData is not yet available → show loading
  if (!homeData) {
    return <Loading/>;
  }

  // Step 2: If API returned an error
  if (homeData.error) {
    return (
      <Error 
        error={ result.error ||"Failed to Load Home Data"  }
      />
    );
  }

  // Step 3: Check if all sections are empty (optional)
  const { products, categories } = homeData;
  const hasNoContent = 
    (!products?.featured?.length &&
     !products?.topDeals?.length &&
     !products?.bestSellers?.length &&
     !products?.newArrivals?.length &&
     !categories?.length);

  if (hasNoContent) {
    return (
      <Error 
        error={ result.error || "There are no products or categories available at the moment." }
      />
    );
  }

  return (
    <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 2 }}>
      {/**HeaderBox section  */}
      <Suspense fallback={<HeaderBoxSkeleton />}>
        <HeaderBox />
      </Suspense>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Category slider section  */}
      <Suspense fallback={<CategorySliderSkeleton />}>
        <CategorySlider initialData={categories}/>
      </Suspense>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Featured section  */}
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts initialData={products.featured} />
      </Suspense>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Deals slider section  */}
      <Suspense fallback={<DealsSliderSkeleton />}>
        <DealsSlider initialData={products.topDeals} />
      </Suspense>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Best Sellers section */}
      <Suspense fallback={<BestSellersSkeleton />}>
        <BestSellers initialData={products.bestSellers}/>
      </Suspense>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />
      
      {/** New Arrivals section */}
      <Suspense fallback={<NewArrivalsSkeleton />}>
        <NewArrivals initialData={products.newArrivals}/>
      </Suspense>
      
      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Why choose us */}
    </Box>
  );
}

export default Home