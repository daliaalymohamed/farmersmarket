// components/skeletons/CheckoutSkeleton.js
'use client';

import { Box, Typography, Paper, Stack, Divider, Card, Table, TableBody, TableCell, TableRow } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid2';

const CheckoutSkeleton = () => {
  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
      {/* Page Title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <Skeleton width="40%" height={40} />
      </Typography>

      <Grid container spacing={4}>
        {/* Left: Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }} elevation={1}>
            {/* Contact Info */}
            <Typography variant="h6" gutterBottom>
              <Skeleton width="60%" height={30} />
            </Typography>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" p={2}>
                <Skeleton variant="circular" width={32} height={32} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton width="80%" height={20} />
                  <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
                  <Skeleton width="70%" height={16} sx={{ mt: 0.5 }} />
                </Box>
              </Stack>
            </Card>

            <Divider sx={{ my: 3 }} />

            {/* Shipping Address */}
            <Typography variant="subtitle1" gutterBottom>
              <Skeleton width="50%" height={24} />
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Skeleton height={20} width="90%" style={{ marginBottom: 8 }} />
              <Skeleton height={20} width="70%" />
              <Skeleton width={60} height={24} style={{ marginTop: 8 }} />
            </Card>

            {/* Billing Address */}
            <Typography variant="subtitle1" gutterBottom>
              <Skeleton width="50%" height={24} />
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Skeleton height={20} width="90%" style={{ marginBottom: 8 }} />
              <Skeleton height={20} width="70%" />
              <Skeleton width={60} height={24} style={{ marginTop: 8 }} />
            </Card>

            <Divider sx={{ my: 3 }} />

            {/* Payment Method */}
            <Typography variant="h6" gutterBottom>
              <Skeleton width="50%" height={30} />
            </Typography>
            <Skeleton variant="rectangular" width={150} height={48} sx={{ mr: 2 }} />
            <Skeleton variant="rectangular" width={130} height={48} />
          </Paper>
        </Grid>

        {/* Right: Order Summary */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Skeleton width="60%" height={30} />
              </Typography>

              <Table size="small">
                <TableBody>
                  {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} />
                          <Skeleton width="60%" height={20} />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton width={50} height={20} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton width={20} height={20} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton width={60} height={20} />
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Skeleton width={50} height={20} style={{ marginLeft: 'auto' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton width={70} height={24} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Skeleton variant="rectangular" width="100%" height={52} sx={{ mt: 3, borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CheckoutSkeleton;