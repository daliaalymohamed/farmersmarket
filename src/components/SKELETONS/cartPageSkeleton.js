// components/skeletons/cartPageSkeleton.js
'use client';

import { Box, Typography, Paper, Stack, Divider } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

const CartPageSkeleton = () => {
  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
      {/* Page Title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <Skeleton width="40%" height={40} />
      </Typography>

      {/* Cart Table */}
      <Paper elevation={1}>
        <Box sx={{ minWidth: 800 }}>
          {/* Table Head */}
          <Box sx={{ display: 'flex', padding: '16px', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ flex: 3 }}>
              <Skeleton width="60%" height={24} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              <Skeleton width="50%" height={20} style={{ marginLeft: 'auto' }} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Skeleton width="40%" height={20} style={{ margin: '0 auto' }} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              <Skeleton width="60%" height={20} style={{ marginLeft: 'auto' }} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Skeleton width="30%" height={20} style={{ margin: '0 auto' }} />
            </Box>
          </Box>

          {/* Table Body - 3 Rows */}
          {[...Array(3)].map((_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                padding: '16px',
                borderBottom: i !== 2 ? 1 : 0,
                borderColor: 'divider',
                alignItems: 'center'
              }}
            >
              {/* Product */}
              <Box sx={{ flex: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={80} height={80} sx={{ borderRadius: 2 }} />
                <Skeleton width="70%" height={24} />
              </Box>

              {/* Price */}
              <Box sx={{ flex: 1, textAlign: 'right' }}>
                <Skeleton width="50%" height={20} style={{ marginLeft: 'auto' }} />
              </Box>

              {/* Quantity */}
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Stack direction="row" justifyContent="center" spacing={1}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton width={32} height={20} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Stack>
              </Box>

              {/* Total */}
              <Box sx={{ flex: 1, textAlign: 'right' }}>
                <Skeleton width="60%" height={20} style={{ marginLeft: 'auto' }} />
              </Box>

              {/* Actions */}
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Summary Section */}
      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Skeleton height={50} width="60%" style={{ marginBottom: 16 }} />
        <Stack spacing={2}>
          <Skeleton height={40} width="40%" />
          <Skeleton height={40} width="40%" />
          <Skeleton height={40} width="40%" />
        </Stack>
        <Skeleton height={50} width="100%" style={{ marginTop: 16, borderRadius: 8 }} />
      </Paper>

      {/* Continue Shopping Button */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Skeleton height={48} width="40%" style={{ margin: '0 auto' }} />
      </Box>
    </Box>
  );
};

export default CartPageSkeleton;