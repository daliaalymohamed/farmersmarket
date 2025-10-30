// components/SKELETONS/FeaturedProductsSkeleton.js
import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, Stack } from '@mui/material';

const FeaturedProductsSkeleton = () => {
  // Simulate 4 product cards
  const items = Array.from({ length: 4 });

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 6, mb: 8 }}>
      {/* Section Header */}
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        <Skeleton width="40%" height={40} sx={{ margin: 'auto' }} />
      </Typography>

      {/* Products Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: { xs: 2, md: 3 },
          justifyContent: 'center'
        }}
      >
        {items.map((_, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Image Placeholder */}
            <Box sx={{ position: 'relative', height: 200, bgcolor: '#f9f9f9' }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
              
              {/* Badge Placeholder */}
              <Skeleton
                variant="circular"
                width={60}
                height={24}
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8
                }}
              />
            </Box>

            <CardContent sx={{ flexGrow: 1, pt: 2 }}>
              {/* Product Name */}
              <Skeleton variant="text" width="80%" height={24} />

              {/* Price */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                <Skeleton variant="text" width="50px" height={30} />
                <Skeleton variant="text" width="40px" height={20} />
              </Stack>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="circular" width={60} height={16} />
                <Skeleton variant="text" width="30px" height={16} sx={{ ml: 1 }} />
              </Box>

              {/* Vendor */}
              <Skeleton variant="text" width="60%" height={20} />
            </CardContent>

            {/* Button Placeholder */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Skeleton variant="rounded" width="100%" height={36} />
            </Box>
          </Card>
        ))}
      </Box>

      {/* View All Link */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Skeleton width="120px" height={24} sx={{ margin: 'auto' }} />
      </Box>
    </Box>
  );
};

export default FeaturedProductsSkeleton;