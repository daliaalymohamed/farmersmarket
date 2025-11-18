// app/checkout/CheckoutForm.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Image from 'next/image';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const CheckoutForm = ({ initialData, profileData }) => {
  const { t, language } = useTranslation();
  const router = useRouter();

  const { cart, subtotal } = initialData;
  const [loading, setLoading] = useState(false);

  if (!cart?.items?.length) return null;
  if (!profileData) return null;

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    addresses = []
  } = profileData;

  // 🔐 Pick default or first available
  const defaultShipping = addresses.find(a => a.isDefaultShipping) || addresses[0];
  const defaultBilling = addresses.find(a => a.isDefaultBilling) || addresses[0];

  // Fallback if no addresses exist
  if (!defaultShipping) {
    return <Alert severity="error">{t('noShippingAddress')}</Alert>;
  }
  if (!defaultBilling) {
    return <Alert severity="error">{t('noBillingAddress')}</Alert>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `${firstName} ${lastName}`,
          email,
          phone: phoneNumber,
          shippingAddress: defaultShipping,
          billingAddress: defaultBilling,
          items: cart.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price
          })),
          total: subtotal
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t('orderPlacedSuccessfully'));
        router.push(`/order-success?orderId=${data.orderId}`);
      } else {
        toast.error(data.error || t('failedToPlaceOrder'));
      }
    } catch (err) {
      toast.error(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
      {/* Page Title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {t('checkout')}
      </Typography>

      <Grid container spacing={4}>
        {/* Left: Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }} elevation={1}>
            {/* Contact Info Section */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {t('contactInformation')}
            </Typography>

            <Card variant="outlined" sx={{ mb: 3, borderColor: 'divider' }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {firstName?.charAt(0).toUpperCase()}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {firstName} {lastName}
                    </Typography>
                    <Stack direction="row" spacing={2} mt={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">{email}</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">{phoneNumber}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />

            {/* 📍 Shipping Address */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('shippingAddress')}
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body2" lineHeight={1.6}>
                {defaultShipping.street}, {defaultShipping.city}, {defaultShipping.state}, {defaultShipping.zipCode}, {defaultShipping.country}
              </Typography>
              {defaultShipping.isDefaultShipping && (
                <Chip
                  label={t('defaultShipping')}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              )}
            </Card>

            {/* 💳 Billing Address */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              {t('billingAddress')}
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body2" lineHeight={1.6}>
                {defaultBilling.street}, {defaultBilling.city}, {defaultBilling.state}, {defaultBilling.zipCode}, {defaultBilling.country}
              </Typography>
              {defaultBilling.isDefaultBilling && (
                <Chip
                  label={t('defaultBilling')}
                  size="small"
                  color="secondary"
                  sx={{ mt: 1 }}
                />
              )}
            </Card>

            <Divider sx={{ my: 3 }} />

            {/* Payment Method */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('paymentMethod')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {}}
              aria-label={t('cashOnDelivery')}
              sx={{
                  mr: 2,
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
              
            >
              {t('cashOnDelivery')}
            </Button>
            <Button variant="outlined" onClick={() => {}}
              aria-label={t('onlinePayment')} sx={{ borderColor: 'background.default', color: 'background.default' }}>
              {t('onlinePayment')}
            </Button>
          </Paper>
        </Grid>

        {/* Right: Order Summary */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('orderSummary')}
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('product')}</TableCell>
                    <TableCell align="right">{t('price')}</TableCell>
                    <TableCell align="center">{t('qty')}</TableCell>
                    <TableCell align="right">{t('total')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Image
                            src={`/api/images/product/${item.image}`}
                            alt={item.name?.[language] || item.name.en || 'Product'}
                            width={40}
                            height={40}
                            style={{ borderRadius: 4 }}
                            loading="lazy"
                          />
                          <span>{item.name?.[language] || item.name.en || 'Unnamed Product'}</span>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {t('EGP')} {(item.price ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {t('EGP')} {((item.price ?? 0) * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <strong>{t('subtotal')}:</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{t('EGP')} {subtotal.toFixed(2)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                    mt: 3, py: 1.5,
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
              >
                {loading ? t('processing') : t('placeOrder')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CheckoutForm;