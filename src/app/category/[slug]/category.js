// app/category/[slug]/category.js
'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  Button,
  Link,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddToCart from '@/components/UI/addToCart';
import { addItemToCart } from "@/store/slices/cartSlice";
import { toast } from "react-toastify";
import Image from 'next/image';

const Category = ({ category, categories = [], relatedProducts = [], pagination }) => {
  const { t, language } = useTranslation();
  const dispatch = useDispatch();

  const [productList, setProductList] = useState(relatedProducts);
  const [paginationState, setPaginationState] = useState(pagination);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Handle Load More
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setLoading(true);

    try {
      const url = new URL(`${baseUrl}/api/category/${category.slug}`);
      url.searchParams.set('page', String(nextPage));
      url.searchParams.set('limit', String(pagination.limit));

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        setProductList(prev => [...prev, ...data.products]);
        setPaginationState(data.pagination);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = async (product) => {
    const cartItem = {
      productId: product._id,
      name: { 
        en: product.name.en || 'Unnamed Product',
        ar: product.name.ar || 'اسم المنتج غير معروف'
      },
      price: product.salePrice > 0 ? product.salePrice : product.price,
      image: product.image,
      quantity: 1,
      maxStock: product.stock || null
    };
    try{
      // ✅ Dispatch and wait for result
      await dispatch(addItemToCart(cartItem)).unwrap();
      
      // Only show success if API succeeded
      toast.success(`${cartItem.name[language]} ${t('isAddedToCart')}`);
    } catch (error) {
      console.error("Error adding to cart: ", error);
      toast.error(t('errorAddingToCart'));
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      {/* Breadcrumb */}
      <Box mb={2}>
        <Link 
            href="/home" 
            style={{ textDecoration: 'none' }} aria-label={t('home')}>
          <Chip label="Home" size="small" />
        </Link>{' '}
        /{' '}
        <Typography component="span" fontWeight="bold">
          {category.name[language] || category.name.en}
        </Typography>
      </Box>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          gutterBottom
        >
          {category.name[language] || category.name.en}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('categoryHeaderDescription')}
        </Typography>
      </Paper>

      {/* Categories Slider */}
      <Paper sx={{ p: 2, mb: 4, bgcolor: '#f8f9fa' }}>
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
            const isActive = cat.slug === category.slug;
            return (
              <Link 
                key={cat._id} 
                href={`/category/${cat.slug}`} 
                style={{ textDecoration: 'none' }}>
                <Chip
                  label={cat.name[language] || cat.name.en}
                  clickable
                  sx={{
                    minWidth: 100,
                    backgroundColor: isActive ? 'text.primary': '#fff',
                    color: isActive ? '#fff' : 'text.primary',
                    '&:hover': {
                      backgroundColor: 'background.default',
                      color: 'background.paper'
                    },
                    border: '1px solid',
                    borderColor: 'text-primary',
                    opacity: isActive ? 1 : 0.85,
                    transition: 'all 0.2s',
                  }}
                />
              </Link>
            );
          })}
        </Box>
      </Paper>

      <Box component="section" aria-labelledby="products-heading" mb={3}>
        <Typography variant="h5" component="h2" gutterBottom>
            {t('products')}
        </Typography>
        {/* Products Grid */}
        <Grid container spacing={3}>
          {
              productList.length === 0 ? (
                  <Grid xs={12}>
                      <Typography variant="h6" gutterBottom textAlign="center">
                      {t('noProductsInCategory')}
                      </Typography>
                  </Grid>
          ) :
          productList.length > 0 ? (
            productList.map((product) => (
              <Grid xs={12} sm={6} md={4} lg={3} key={product._id}>
                <Card
                  component={Link}
                  href={`/product/${product.slug}`}
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' },
                    position: 'relative' // ✅ This is required for absolute positioning inside
                  }}
                >
                  {/* 🔶 Discount Badge */}
                  {product.discountPercentage > 0 && (
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
                      {product.discountPercentage} {t('off')}
                      </Box>
                  )}
                  {/* 🔶 Product Image */}
                  <Box sx={{ position: 'relative', width: '100%', height: 200, bgcolor: '#f9f9f9' }}>
                    <Image
                      src={`/api/images/product/${product.image}`}
                      alt={product.name.en}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 600px"
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  </Box>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      component="h3"
                      fontWeight="bold"
                      noWrap
                      sx={{ fontSize: '1rem', lineHeight: 1.4 }}
                    >
                      {product.name[language] || product.name.en}
                    </Typography>
                    <Box mt={1}>
                      {product.isOnSale && product.salePrice > 0 ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="error" fontWeight="bold">
                            {t('EGP')} {product.salePrice.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through', fontSize: '0.8rem' }}
                          >
                            {t('EGP')} {product.price.toFixed(2)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" fontWeight="bold">
                          {t('EGP')} {product.price.toFixed(2)}
                        </Typography>
                      )}
                    </Box>

                    {/* Stock Info */}
                    {product.stock === 0 ? (
                      <Typography variant="body2" color="error" fontSize="0.8rem" mt={0.5}>
                        {t('outOfStock')}
                      </Typography>
                    ) : product.stock < 10 ? (
                      <Typography variant="body2" fontSize="0.8rem" mt={0.5} sx={{ 
                          color: '#d35400', 
                          fontSize: '0.8rem', 
                          mt: 0.5 
                        }}>
                        {product.stock} {t('leftInStock')}
                      </Typography>
                    ) : null}

                    {/* ✅ Add to Cart Button */}
                    <Box sx={{ mt: 1.5 }}>
                      <AddToCart
                        size="small"
                        disabled={product.stock === 0}
                        product={product}
                        onAddToCart={(e) => handleAddToCart(e, product)}
                        sx={{ width: '100%' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
          ))
          ) : (
            <Grid xs={12}>
              <Alert severity="info">{t('noProductsFound')}</Alert>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Load More Button */}
      {paginationState.hasNextPage && (
        <Box textAlign="center" mt={4}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? t('loadingMore') : t('loadMore')}
          </Button>
        </Box>
      )}

      {!paginationState.hasNextPage && productList.length > 0 && (
        <Typography textAlign="center" color="text.secondary" mt={4}>
          {t('endOfResults')}
        </Typography>
      )}
    </Container>
  );
}

export default Category;