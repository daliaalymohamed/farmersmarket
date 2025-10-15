'use client';
import { lazy } from 'react';
import { Box, Divider } from '@mui/material';
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
      <HeaderBox />

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Category slider section  */}
      <CategorySlider initialData={categories}/>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Featured section  */}
      <FeaturedProducts initialData={products.featured} />

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Deals slider section  */}
      <DealsSlider initialData={products.topDeals} />

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Best Sellers section */}
      <BestSellers initialData={products.bestSellers}/>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />
      
      {/** New Arrivals section */}
      <NewArrivals initialData={products.newArrivals}/>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Why choose us */}
    </Box>
  );
}

export default Home