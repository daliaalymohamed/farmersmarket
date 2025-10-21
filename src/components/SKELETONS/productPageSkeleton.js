'use client';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid2'; // For MUI v5.11+ syntax

const ProductPageSkeleton = () => {
  return (
    <Container sx={{ py: 4 }}>
      {/* Categories Slider Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          <Skeleton width="40%" />
        </Typography>

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
            <Box key={i}>
              <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 20 }} />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Main Product Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={4}>
          {/* Image Placeholder */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 400,
                height: { xs: 300, md: 400 },
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#f9f9f9',
              }}
            >
              {/* Discount Badge Skeleton */}
              <Skeleton
                variant="rectangular"
                sx={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  bgcolor: 'error.main',
                  color: 'white',
                  px: 1.4,
                  py: 0.3,
                  borderRadius: 0.8,
                  fontSize: '0.75rem',
                  minWidth: 48,
                  zIndex: 1
                }}
                width={48}
              />

              {/* Image Skeleton */}
              <Skeleton
                variant="rectangular"
                sx={{ width: '100%', height: '100%' }}
              />
            </Box>
          </Grid>

          {/* Info Side */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Skeleton variant="text">
              <Typography variant="h4">&nbsp;</Typography>
            </Skeleton>

            <Skeleton variant="text" width="90%">
              <Typography variant="body1">&nbsp;</Typography>
            </Skeleton>
            <Skeleton variant="text" width="80%">
              <Typography variant="body1">&nbsp;</Typography>
            </Skeleton>

            {/* Price */}
            <Box mt={2}>
              <Skeleton variant="text" width="30%">
                <Typography variant="h5">&nbsp;</Typography>
              </Skeleton>
            </Box>

            {/* Category Chip */}
            <Box mt={2}>
              <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 2 }} />
            </Box>

            {/* Stock Indicator */}
            <Box mt={2}>
              <Skeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: 2 }} />
            </Box>

            {/* Quantity Selector */}
            <Box mt={3}>
              <Skeleton variant="text" width="20%">
                <Typography variant="body1">&nbsp;</Typography>
              </Skeleton>
              <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                <Skeleton variant="circular" width={36} height={36} />
                <Skeleton variant="text" width={40} height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="circular" width={36} height={36} />
              </Stack>
            </Box>

            {/* Add to Cart Button */}
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ mt: 3, borderRadius: 1 }} />

            {/* Vendor Info */}
            <Box mt={3} p={2} border={1} borderColor="divider" borderRadius={2}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Related Products Section */}
      <Paper sx={{ p: 3, mt: 2 }}>
        <Skeleton variant="text" width="30%">
          <Typography variant="h6">&nbsp;</Typography>
        </Skeleton>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[...Array(4)].map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textDecoration: 'none', color: 'inherit' }}>
                <Box sx={{ position: 'relative', width: '100%', height: 180, bgcolor: '#f9f9f9' }}>
                  <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} />
                </Box>
                <CardContent>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" sx={{ mt: 0.5 }} />
                  <Skeleton variant="text" width="50%" sx={{ mt: 0.5 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProductPageSkeleton;