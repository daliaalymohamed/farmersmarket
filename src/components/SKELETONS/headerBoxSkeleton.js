// components/SKELETONS/HeaderBoxSkeleton.js
import React from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';

const HeaderBoxSkeleton = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        width: '100%',
        gap: 2,
        mt: 4,
      }}
    >
      {/* Image Side Skeleton */}
      <Box
        sx={{
          flex: { xs: 'none', md: '1 1 50%' },
          minWidth: '250px',
          position: 'relative',
          aspectRatio: { xs: '16/9', md: '16/9' },
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>

      {/* Text & Search Side Skeleton */}
      <Box
        sx={{
          flex: { xs: 'auto', md: '1 1 50%' },
          minWidth: '250px',
          height: { xs: 'auto', md: '500px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3,
          bgcolor: '#fff',
          p: 2,
          borderRadius: '8px',
        }}
      >
        {/* Title */}
        <Skeleton variant="text" width="70%" height={40} />
        <Skeleton variant="text" width="60%" height={30} />

        {/* Search Input */}
        <Box sx={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
          <Skeleton variant="rounded" width="100%" height={56} />
          
          {/* Dropdown Suggestions Placeholder */}
          <Box mt={1}>
            {[...Array(4)].map((_, i) => (
              <Paper
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  my: 0.5,
                  mx: 0.5,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
                <Skeleton variant="circular" width={24} height={24} />
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HeaderBoxSkeleton;