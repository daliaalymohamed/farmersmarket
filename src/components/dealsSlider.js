"use client";
import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { addItemToCart } from "@/store/slices/cartSlice";
import { toast } from "react-toastify";
import { Box, Typography, Card, CardContent, CardActionArea, Button } from "@mui/material";
import Image from "next/image";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import AddToCart from "./UI/addToCart";

const DealsSlider = ({ initialData }) => {
  const { t, language } = useTranslation()
  const dispatch = useDispatch();

  // Ref for scroll container
  const scrollRef = useRef(null);

   // Scroll function
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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

  if (!initialData || initialData.length === 0) return null;

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 6, mb: 8 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>
          {t("topDeals")}
        </Typography>
        
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <button
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
              justifyContent: 'center'
            }}
            type="button"
          >
            ←
          </button>
          <button
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
              justifyContent: 'center'
            }}
            type="button"
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
            backgroundColor: '#bdbdbd',
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
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea component="a" href={`/product/${product.slug || product._id}`}>
              {/* Image */}
              <Box sx={{ position: 'relative', height: 200, bgcolor: '#f9f9f9' }}>
                <Image
                  src={product.image ? `/api/images/product/${product.image}` : '/placeholder.webp'}
                  alt={product.name[language] || product.name.en}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
                {/* Discount Badge */}
                {product.discountPercentage > 0 && (
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'error.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                  }}>
                    {product.discountPercentage}% {t('off')}
                  </Box>
                )}
              </Box>

              <CardContent>
                <Typography variant="subtitle1" fontWeight="medium" noWrap>
                  {product.name[language] || product.name.en}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {t('EGP')} {product.salePrice?.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    {t('EGP')} {product.price.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {product.vendor?.name?.[language] || product.vendor?.name?.en}
                </Typography>
              </CardContent>
            </CardActionArea>

            {/* Add to Cart Button */}
            <AddToCart product={product} onAddToCart={handleAddToCart} disabled={product.stock === 0}/>
          </Card>
        ))}
      </Box>

      {/* View All Link */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography
          component="a"
          href="/deals"
          color="text.primary"
          sx={{ fontWeight: 'bold', textDecoration: 'underline' }}
        >
          {t('viewAllDeals')}
        </Typography>
      </Box>
    </Box>
  );
};

export default DealsSlider;