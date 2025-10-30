// components/SKELETONS/CategorySliderSkeleton.js
import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';

const CategorySliderSkeleton = () => {
  // Simulate 6 category slides
  const items = Array.from({ length: 6 });

  return (
    <Box sx={{ width: '80%', margin: 'auto', mt: 4 }}>
      {/* Title */}
      <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>
        <Skeleton width="40%" />
      </Typography>

      {/* Slider-like Layout (using Flexbox) */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflow: 'hidden',
          py: 1,
          '& > *': { flex: '0 0 auto', width: { xs: '100%', sm: '50%', md: '25%' } }
        }}
      >
        {items.map((_, index) => (
          <Card
            key={index}
            sx={{
              textAlign: 'center',
              width: { xs: 100, sm: 120, md: 140 },
              margin: 'auto'
            }}
          >
            <CardContent>
              {/* Circular Image Placeholder */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 100, sm: 120, md: 140 },
                  height: { xs: 100, sm: 120, md: 140 },
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: 'auto',
                  bgcolor: '#f5f5f5',
                  border: '4px solid #fff',
                  boxShadow: 1
                }}
              >
                <Skeleton variant="circular" width="100%" height="100%" />
              </Box>

              {/* Title Placeholder */}
              <Box sx={{ mt: 2 }}>
                <Skeleton height={20} width="80%" sx={{ margin: 'auto' }} />
                <Skeleton height={20} width="60%" sx={{ margin: 'auto', mt: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default CategorySliderSkeleton;