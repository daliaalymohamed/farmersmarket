// app/product/[slug]/page.js
'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/translationContext';
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Stack,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import Grid from "@mui/material/Grid2"; // ✅ Correct import
import { Add, Remove } from '@mui/icons-material';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import AddToCart from '@/components/UI/addToCart';
// import { addToCart } from "@/store/slices/cartSlice";
import { toast } from "react-toastify";
import Image from 'next/image';
import Link from 'next/link';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

const StockIndicator = ({ stock }) => {
  const { t } = useTranslation();
  if (stock === 0)
    return <Chip label={t('outOfStock')} color="error" size="small" />;
  if (stock < 10)
    return (
      <Chip label={`${stock} ${t('leftInStock')}`} color="warning" size="small" />
    );
  return <Chip label={t('inStock')} sx={{
                  backgroundColor: 'background.default',
                  color: 'background.paper'
                }} size="small" />;
};

const ProductPage = ({ productData, relatedProducts, categories }) => {
  const { t, language } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => setQuantity((q) => q + 1);
  const handleDecrease = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  // Handle Add to Cart
  const handleAddToCart = (product) => {
      const cartItem = {
        productId: product._id,
        name: product.name[language] || product.name.en,
        price: product.salePrice > 0 ? product.salePrice : product.price,
        image: product.image,
        quantity: 1,
        slug: productData.slug,
      };
  
      // dispatch(addToCart(cartItem));
      toast.success(`${cartItem.name[language] || cartItem.name} added to cart!`);
  };
  
  const hasRelatedProducts = Array.isArray(relatedProducts) && relatedProducts.length > 0;
  
  return (
    <Container sx={{ py: 4 }}>
      {/* Categories Slider Section */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: '#f8f9fa'
        }}
      >
        <Typography
          variant="subtitle2"
          component="h2"
          fontWeight="bold"
          gutterBottom
        >
          {t('shopByCategory')}
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
          {categories.map((cat) => {
            const isActive =
              cat.slug === productData.categoryId?.slug ||
              cat._id === productData.categoryId?._id;

            return (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <Chip
                  label={cat.name[language] || cat.name.en}
                  clickable
                  sx={{
                    minWidth: 100,
                    backgroundColor: isActive ? 'text.primary' : '#fff',
                    color: isActive ? '#fff' : 'text.primary',
                    '&:hover': {
                      backgroundColor: 'background.default',
                      color: 'background.paper'
                    },
                    border: '1px solid',
                    borderColor: 'text-primary',
                    opacity: isActive ? 1 : 0.85,
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              </Link>
            );
          })}
        </Box>
      </Paper>

      {/* Main Product Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={4}>
          {/* Image */}
            <Grid 
              size={{ xs: 12, md: 6 }} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                // Ensure proper positioning context
                position: 'relative'
            }}
          >
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
              {/* 🔶 Discount Badge */}
                {productData.discountPercentage > 0 && (
                    <Box
                      component="span"
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        bgcolor: 'error.main',
                        color: 'white',
                        px: 1.4,
                        py: 0.3,
                        borderRadius: 0.8,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        zIndex: 1,
                        boxShadow: 1,
                        whiteSpace: 'nowrap',       // ✅ Prevents line breaks
                        minWidth: 48,               // ✅ Ensures consistent width
                        textAlign: 'center',
                        display: 'inline-block'
                      }}
                    >
                    {productData.discountPercentage} {t('off')}
                    </Box>
                )}
              <Image
                src={`/api/images/product/${productData.image}`}
                alt={productData.name[language] || productData.name.en}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 400px"
                style={{ 
                  objectFit: 'cover',
                  // Force display block
                  display: 'block'
                }}
                priority
              />
            </Box>
          </Grid>

          {/* Info */}
          <Grid xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {productData.name[language] || productData.name.en}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {productData.description?.[language] ||
                productData.description?.en}
            </Typography>

            {/* Price */}
            <Box mt={2}>
              {productData.isOnSale && productData.salePrice > 0 ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h5" color="error" fontWeight="bold">
                    {formatCurrency(productData.salePrice)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    {formatCurrency(productData.price)}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(productData.price)}
                </Typography>
              )}
            </Box>

            {/* Category */}
            <Box mt={2}>
              <Chip
                label={
                  productData.categoryId?.name?.[language] ||
                  productData.categoryId?.name?.en ||
                  t('uncategorized')
                }
                sx={{
                  backgroundColor: 'text.primary',
                  color: '#fff',
                }}
                size="small"
              />
            </Box>

            {/* Stock */}
            <Box mt={2}>
              <StockIndicator stock={productData.stock && productData.stock > 0 && productData.stock} />
            </Box>

            {/* Quantity Selector */}
            <Box mt={3}>
              <Typography variant="body1" fontWeight="medium">
                {t('quantity')}:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={handleDecrease} disabled={quantity <= 1}>
                  <Remove fontSize="small" />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton size="small" onClick={handleIncrease}>
                  <Add fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {/* Add to Cart */}
            <AddToCart 
                size='large'
                disabled={productData.stock === 0}
                product={productData} onAddToCart={(e) => handleAddToCart(e, productData)} 
                sx={{ mt: 3, py: 1.5 }}/>

            {/* Vendor */}
            {productData.vendorId && (
              <Box mt={3} p={2} border={1} borderColor="divider" borderRadius={2}>
                <Typography variant="body2" color="text.secondary">
                  {t('soldBy')}:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {productData.vendorId.name}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Related Products Section */}
      {hasRelatedProducts && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {t('relatedProducts')}
          </Typography>

          <Grid container spacing={3}>
            {relatedProducts.map((p) => (
              <Grid key={p._id} xs={12} sm={6} md={3}>
                <Card component="a" href={`/product/${p.slug}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                  <Box sx={{ position: 'relative', width: '100%', height: 180, bgcolor: '#f9f9f9' }}>
                    <Image
                      src={`/api/images/product/${p.image}`}
                      alt={p.name.en}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                      {p.name[language] || p.name.en}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {p.categoryId?.name?.en}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" mt={0.5}>
                      {formatCurrency(p.isOnSale ? p.salePrice : p.price)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default ProductPage;