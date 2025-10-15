// components/UI/addToCart.js
import React from "react";
import { Box, Button } from "@mui/material";
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import { useTranslation } from "@/contexts/translationContext";

const AddToCart = ({ product, onAddToCart, size = "small", fullWidth = true, disabled }) => {
  const { t } = useTranslation();

  const handleClick = (e) => {
    e.preventDefault(); // Prevent any default navigation
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const labelText = product ? `${t('addToCart')} - ${product.name}` : t('addToCart');

  return (
    <Box sx={{ p: 2, pt: 0 }}>
      <Button
        fullWidth={fullWidth}
        variant="contained"
        size={size}
        onClick={handleClick}
        startIcon={<ShoppingCart />}
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
        aria-label={labelText} 
        title={labelText}
        disabled={disabled}
      >
        {t('addToCart')} {/* Proper localized label */}
      </Button>
    </Box>
  );
};

export default AddToCart;