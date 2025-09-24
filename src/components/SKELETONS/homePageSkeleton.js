// components/SKELETONS/HomePageSkeleton.js
import { memo } from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

const ProductCardSkeleton = memo(() => (
  <Card sx={{ minWidth: 280, maxWidth: 320, m: 1, flexShrink: 0 }}>
    <Skeleton animate="pulse" variant="rectangular" height={200} />
    <CardContent>
      <Skeleton animate="pulse" variant="text" sx={{ fontSize: '1.2rem', mb: 1 }} />
      <Skeleton animate="pulse" variant="text" width="60%" sx={{ mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton animate="pulse" variant="text" width="40%" />
        <Skeleton animate="pulse" variant="text" width="30%" />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Skeleton animate="pulse" variant="circular" width={20} height={20} />
        <Skeleton animate="pulse" variant="text" width="50%" />
      </Box>
      <Skeleton animate="pulse" variant="rectangular" height={36} />
    </CardContent>
  </Card>
));

const CategoryCardSkeleton = memo(() => (
  <Box sx={{ textAlign: 'center', minWidth: 120, m: 1, flexShrink: 0 }}>
    <Skeleton
      animate="pulse" 
      variant="rectangular" 
      width={100} 
      height={100} 
      sx={{ mx: 'auto', borderRadius: 2 }} 
    />
    <Skeleton animate="pulse" variant="text" sx={{ mt: 1, mx: 'auto', width: '80%' }} />
  </Box>
));

const SectionSkeleton = memo(({ title, itemCount = 4, type = 'product' }) => (
  <Box sx={{ width: '100%', mb: 4 }}>
    <Box sx={{ mb: 3, px: 2 }}>
      <Skeleton animate="pulse" variant="text" sx={{ fontSize: '2rem', maxWidth: 300, mb: 1 }} />
      <Skeleton animate="pulse" variant="text" width="60%" sx={{ fontSize: '1rem' }} />
    </Box>
    
    <Box sx={{ 
      display: 'flex', 
      overflowX: 'auto', 
      gap: 2,
      px: 2,
      pb: 2,
      '&::-webkit-scrollbar': { height: 8 },
      '&::-webkit-scrollbar-thumb': { 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        borderRadius: 4 
      }
    }}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Box key={index}>
          {type === 'category' ? <CategoryCardSkeleton /> : <ProductCardSkeleton />}
        </Box>
      ))}
    </Box>
  </Box>
));

const HomePageSkeleton = memo(() => {
  return (
    <Box sx={{ width: "100%", minHeight: '100vh' }}>
      
      {/* Header Box Skeleton */}
      <Box sx={{ width: '100%', mb: 4, px: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* Image Side Skeleton */}
        <Skeleton 
          animate="pulse"
          variant="rectangular"
          width="100%"
          sx={{ 
            flex: '1 1 50%',
            aspectRatio: '16/9',
            borderRadius: '8px',
            maxWidth: { xs: '100%', md: '50%' }
          }}
        />

        {/* Text & Search Side Skeleton */}
        <Box sx={{ 
          flex: '1 1 50%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          gap: 3,
          textAlign: 'center'
        }}>
          <Skeleton animate="pulse" variant="text" sx={{ fontSize: '2rem', width: '80%', mx: 'auto' }} />
          <Skeleton animate="pulse" variant="text" sx={{ fontSize: '1.2rem', width: '60%', mx: 'auto' }} />
          <Skeleton 
            animate="pulse"
            variant="rounded"
            sx={{ width: '70%', height: 56, borderRadius: '16px', mx: 'auto' }}
          />
        </Box>
      </Box>

      {/* Loading indicator */}
      <Box aria-label="Loading content..." role="status" aria-live="polite">
        <Skeleton animate="pulse" variant="text" sx={{ fontSize: '1.5rem', maxWidth: 200, mx: 'auto' }} />
      </Box>

      {/* Category Slider Skeleton */}
      <SectionSkeleton title="Browse Categories" itemCount={8} type="category" />

      {/** isFeatured Skeleton */}
      <SectionSkeleton title="Featured Products" itemCount={5} type="product" />

      {/* Deals Slider "isOnSale" Skeleton */}
      <SectionSkeleton title="Top Deals" itemCount={5} type="product" />

      {/* Best Sellers "most Ordered products" Skeleton */}
      <SectionSkeleton title="Best Sellers" itemCount={5} type="product" />

      {/* New Arrivals "Recently added products" Skeleton */}
      <SectionSkeleton title="New Arrivals" itemCount={5} type="product" />
    </Box>
  );
});

export default HomePageSkeleton;