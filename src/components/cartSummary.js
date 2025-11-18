// components/cartSummary.js
'use client';

import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectCartTotal, selectCartCount } from '@/store/slices/cartSlice';
import { useTranslation } from '@/contexts/translationContext';
import { Box, Typography, Button } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const CartSummary = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info(t('pleaseLoginToCheckout'));
      router.push(`/login?redirect=/cart`);
      return;
    }
    router.push('/checkout');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Box>
        <Typography variant="h6">
          {t('total')}: <strong>{t('EGP')} {total.toFixed(2)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {count} {t('itemsInCart')}
        </Typography>
      </Box>
      <Button
        sx={{
          textTransform: 'none',
          fontWeight: 'bold',
          py: 1,
          backgroundColor: 'text.primary',
          color: '#fff',
          '&:hover': {
            backgroundColor: 'background.default',
            color: 'background.paper'
          }
        }}
        variant="contained"
        size="large"
        startIcon={<ShoppingCart />}
        onClick={handleCheckout}
      >
        {t('proceedToCheckout')}
      </Button>
    </Box>
  );
};

export default memo(CartSummary);