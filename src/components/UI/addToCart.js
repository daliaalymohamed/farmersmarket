// components/UI/addToCart.js
import React from "react";
import { Box, Button } from "@mui/material";
import { useTranslation } from "@/contexts/translationContext";

const AddToCart = ({ product, onAddToCart, size = "small", fullWidth = true }) => {
  const { t } = useTranslation();

  const handleClick = (e) => {
    e.preventDefault(); // Prevent any default navigation
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <Box sx={{ p: 2, pt: 0 }}>
      <Button
        fullWidth={fullWidth}
        variant="contained"
        color="secondary" // Changed from secondary to primary (standard)
        size={size}
        onClick={handleClick}
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
      >
        {t('addToCart')} {/* Proper localized label */}
      </Button>
    </Box>
  );
};

export default AddToCart;