// components/SKELETONS/BestSellersSkeleton.js
import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, Stack } from '@mui/material';

const BestSellersSkeleton = () => {
  // Simulate 5 best seller cards
  const items = Array.from({ length: 5 });

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 6, mb: 8 }}>
      {/* Section Header with Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Skeleton width={140} height={40} />
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      </Box>

      {/* Scrollable Container */}
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 2,
          py: 1,
          px: 2,
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#bdbdbd', borderRadius: 4 },
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none'
        }}
      >
        {items.map((_, index) => (
          <Card
            key={index}
            sx={{
              minWidth: { xs: '280px', sm: '300px' },
              maxWidth: '320px',
              flexShrink: 0,
              height: '100%',
              position: 'relative'
            }}
          >
            {/* Best Seller Badge Placeholder */}
            <Skeleton
              variant="rectangular"
              width={70}
              height={24}
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                borderRadius: 1,
                zIndex: 2
              }}
            />

            {/* Image Placeholder */}
            <Box sx={{ position: 'relative', height: 200, bgcolor: '#f9f9f9' }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Box>

            <CardContent>
              {/* Product Name */}
              <Skeleton variant="text" width="80%" height={24} />

              {/* Price */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                <Skeleton variant="text" width="50px" height={30} />
                <Skeleton variant="text" width="40px" height={20} />
              </Stack>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="rectangular" width={60} height={16} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="30px" height={16} sx={{ ml: 1 }} />
              </Box>

              {/* Vendor */}
              <Skeleton variant="text" width="60%" height={20} />
            </CardContent>

            {/* Add to Cart Button Placeholder */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Skeleton variant="rounded" width="100%" height={36} />
            </Box>
          </Card>
        ))}
      </Box>

      {/* View All Link */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Skeleton width="140px" height={24} sx={{ margin: 'auto' }} />
      </Box>
    </Box>
  );
};

export default BestSellersSkeleton;