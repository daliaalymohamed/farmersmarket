// components/SKELETONS/caategoryPageSkeleton.js
import { memo } from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Skeleton } from '@mui/material';

const CategoryPageSkeleton = memo(() => {
  return (
    <Box sx={{ py: 4 }}>
      {/* Breadcrumb Skeleton */}
      <Box mb={2} display="flex" alignItems="center">
        <Skeleton variant="rectangular" width={60} height={30} sx={{ borderRadius: 1 }} />
        <Typography variant="body1" mx={1}>/</Typography>
        <Skeleton variant="text" width={150} />
      </Box>

      {/* Header Skeleton */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="80%" height={20} />
      </Paper>

      {/* Categories Slider Skeleton */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Skeleton variant="text" width={150} height={24} />
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={100}
              height={36}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      </Paper>

      {/* Products Grid Label */}
      <Typography variant="h6" gutterBottom>
        <Skeleton width={120} />
      </Typography>

      {/* Products Grid Skeleton */}
      <Grid container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ position: 'relative' }}>
              {/* Discount Badge Placeholder */}
              <Box sx={{ position: 'absolute', top: 6, left: 6, zIndex: 1 }}>
                <Skeleton variant="rectangular" width={48} height={20} sx={{ borderRadius: 0.8 }} />
              </Box>

              {/* Image */}
              <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
                <Skeleton variant="rectangular" width="100%" height="100%" />
              </Box>

              {/* Content */}
              <CardContent>
                <Skeleton variant="text" width="80%" height={24} />
                <Box mt={1}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
                </Box>

                {/* Stock */}
                <Skeleton variant="text" width="50%" height={16} sx={{ mt: 1 }} />

                {/* Add to Cart Button */}
                <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 1.5, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Load More Button Placeholder */}
      <Box textAlign="center" mt={4}>
        <Skeleton variant="rectangular" width={120} height={40} sx={{ mx: 'auto', borderRadius: 1 }} />
      </Box>
    </Box>
  );
});

export default CategoryPageSkeleton;