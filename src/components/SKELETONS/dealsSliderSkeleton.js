// components/SKELETONS/DealsSliderSkeleton.js
import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';

const DealsSliderSkeleton = () => {
  // Simulate 5 deal cards
  const items = Array.from({ length: 5 });

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 6, mb: 8 }}>
      {/* Section Header with Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Skeleton width={120} height={40} />
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
              height: '100%'
            }}
          >
            {/* Image Placeholder */}
            <Box sx={{ position: 'relative', height: 200, bgcolor: '#f9f9f9' }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Box>

            <CardContent>
              {/* Title */}
              <Skeleton variant="text" width="80%" height={24} />

              {/* Price */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Skeleton variant="text" width="50px" height={30} />
                <Skeleton variant="text" width="40px" height={20} />
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
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Skeleton width="100px" height={24} sx={{ margin: 'auto' }} />
      </Box>
    </Box>
  );
};

export default DealsSliderSkeleton;