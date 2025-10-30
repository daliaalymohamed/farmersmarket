"use client";
import React, { useRef } from "react";
import { useDispatch } from "react-redux";
// import { addToCart } from "@/store/slices/cartSlice";
import { toast } from "react-toastify";
import Image from "next/image"; // Import Next.js Image
import { Box, Card, CardContent, CardActionArea, Typography, Chip, Stack, Button } from "@mui/material";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import AddToCart from "./UI/addToCart";

const NewArrivals = ({ initialData }) => {
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

  // Ref for scroll container
  const scrollRef = useRef(null);
  
  // Scroll function
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!initialData || initialData.length === 0) return null;
  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 6, mb: 8 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>
          {t("newArrivals")}
        </Typography>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <button
            type="button"
            aria-label={t('previous')}
            onClick={() => scroll('left')}
            style={{
              border: 'none',
              background: '#f0f0f0',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={t('next')}
            onClick={() => scroll('right')}
            style={{
              border: 'none',
              background: '#f0f0f0',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
          >
            →
          </button>
        </Box>
      </Box>

      {/* Scrollable Container */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 2,
          py: 1,
          px: 2,
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            height: 8
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#8b5cf6', // Purple accent
            borderRadius: 4
          },
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none'
        }}
      >
        {initialData.map((product) => (
          <Card
            key={product._id}
            sx={{
              minWidth: { xs: '280px', sm: '300px' },
              maxWidth: '320px',
              flexShrink: 0,
              height: '100%',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            {/* New Arrival Badge */}
            <Chip
              label={t('new')}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 2,
                fontWeight: 'bold',
                fontSize: '0.75rem',
                px: 1,
                backgroundColor: 'background.default',
                color: 'background.paper'
              }}
            />

            <CardActionArea component="a" href={`/product/${product.slug || product._id}`}>
              {/* Product Image */}
              <Box sx={{ position: 'relative', height: 200, bgcolor: '#fafafa' }}>
                <Image
                  src={product.image ? `/api/images/product/${product.image}` : '/placeholder.webp'}
                  alt={product.name[language] || product.name.en}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </Box>

              <CardContent>
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

                {/* Vendor */}
                {product.vendor?.name && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {t('by')} {product.vendor.name}
                  </Typography>
                )}

                {/* Category */}
                {product.category?.name && (
                  <Typography variant="caption" color="text.disabled" noWrap sx={{ mt: 0.5 }}>
                    {product.category.name[language] || product.category.name.en}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
            
            {/* Add to Cart Button */}
            <AddToCart product={product} onAddToCart={handleAddToCart} disabled={product.stock === 0}/>
          </Card>
        ))}
      </Box>

      {/* View All Link */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography
          component="a"
          href="/products?sort=newest"
          color="text.primary"
          sx={{
            fontWeight: 'bold',
            textDecoration: 'underline',
            '&:hover': { cursor: 'pointer' }
          }}
        >
          {t('viewAllNewArrivals')}
        </Typography>
      </Box>
    </Box>
  );

}

export default NewArrivals