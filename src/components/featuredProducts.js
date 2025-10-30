"use client";
import React from "react";
import { useDispatch } from "react-redux";
// import { addToCart } from "@/store/slices/cartSlice";
import { toast } from "react-toastify";
import Image from "next/image"; // Import Next.js Image
import { Box, Card, CardContent, CardActionArea, Typography, Chip, Rating, Stack, Button } from "@mui/material";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import AddToCart from "./UI/addToCart";

const FeaturedProducts = ({ initialData }) => {
  const { t, language } = useTranslation()
  const dispatch = useDispatch();

  // Handle Add to Cart
  const handleAddToCart = (product) => {
    const cartItem = {
      productId: product._id,
      name: product.name[language] || product.name.en,
      price: product.salePrice > 0 ? product.salePrice : product.price,
      image: product.image,
      quantity: 1,
      maxStock: product.stock || null
    };

    // dispatch(addToCart(cartItem));
    toast.success(`${cartItem.name[language] || cartItem.name} added to cart!`);
  };

  if (!initialData || initialData.length === 0) return null;
  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 6, mb: 8 }}>
      {/* Section Header */}
      <Typography variant="h4" sx={{mb: 3, textAlign: 'center' }}>
        {t("featuredProducts")}
      </Typography>

      {/* Products Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: { xs: 2, md: 3 },
          justifyContent: 'center'
        }}
      >
        {initialData.map((product) => (
          <Card
            key={product._id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardActionArea component="a" href={`/product/${product.slug || product._id}`}>
              {/* Image Container */}
              <Box sx={{ position: 'relative', height: 200, bgcolor: '#f9f9f9' }}>
                <Image
                  src={product.image ? `/api/images/product/${product.image}` : '/placeholder.webp'}
                  alt={product.name[language] || product.name.en || 'Product'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
                
                {/* Discount Badge */}
                {product.discountPercentage > 0 && (
                  <Chip
                    label={`${product.discountPercentage}% ${t('off')}`}
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}
                  />
                )}

                {/* Sale Badge */}
                {product.isOnSale && !product.discountPercentage && (
                  <Chip
                    label={t('onSale')}
                    color="warning"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                {/* Product Name */}
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  noWrap
                  title={product.name[language] || product.name.en}
                  sx={{ mb: 1 }}
                >
                  {product.name[language] || product.name.en}
                </Typography>

                {/* Price */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {product.salePrice ? (
                    <>
                      <Typography variant="h6" color="error.main" fontWeight="bold">
                        {t('EGP')} {product.salePrice.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        {t('EGP')} {product.price.toFixed(2)}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="h6" fontWeight="bold">
                      {t('EGP')} {product.price.toFixed(2)}
                    </Typography>
                  )}
                </Stack>

                {/* Rating */}
                {product.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={product.rating} precision={0.5} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({product.reviewCount || 0})
                    </Typography>
                  </Box>
                )}

                {/* Vendor */}
                {product.vendor?.name && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {t('by')} {product.vendor.name}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>

            {/* Add to Cart Button */}
            <AddToCart product={product} onAddToCart={handleAddToCart}  disabled={product.stock === 0}/>
          </Card>
        ))}
      </Box>

      {/* View All Button (Optional) */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography
          component="a"
          href="/products?isFeatured=true"
          color="text.primary"
          sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            '&:hover': { cursor: 'pointer' }
          }}
        >
          {t('viewAllFeatured')}
        </Typography>
      </Box>
    </Box>
  );

}

export default FeaturedProducts