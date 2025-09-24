"use client";
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { Box, Card, CardContent, Typography, IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import Image from "next/image";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation


// Custom Arrow Component
const CustomPrevArrow = ({ onClick, ariaLabel }) => (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1,
        backgroundColor: "white",
        boxShadow: 2,
        "&:hover": { backgroundColor: "gray" },
      }}
    >
      <ArrowBackIos />
    </IconButton>
  );
  
  const CustomNextArrow = ({ onClick, ariaLabel }) => (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        position: "absolute",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1,
        backgroundColor: "white",
        boxShadow: 2,
        "&:hover": { backgroundColor: "gray" },
      }}
    >
      <ArrowForwardIos />
    </IconButton>
  );

const CategorySlider = ({initialData}) => {
  const { t, language } = useTranslation()

  if (!initialData || initialData.length === 0) return null;

  // slider slick settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4, // Number of items visible at a time
    slidesToScroll: 1,
    // autoplay: true, // Enable auto-move
    // autoplaySpeed: 2000, // Move every 2 seconds
    // pauseOnHover: false, // Keep moving even when hovered
    prevArrow: <CustomPrevArrow ariaLabel={t('prevArrow')}/>,
    nextArrow: <CustomNextArrow ariaLabel={t('nextArrow')}/>,
    responsive: [
      {
        breakpoint: 768, // Tablet
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 480, // Mobile
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };
  return (
    <Box sx={{ width: "80%", margin: "auto", mt: 4, position: "relative" }}>
      <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>
          {t("order")}
      </Typography>
      <Slider {...settings}>
       {
        initialData.map((item) => (
          <Card
          sx={{
            textAlign: "center",
            cursor: "pointer",
            transition: "transform 0.3s",
            "&:hover": { transform: "scale(1.05)" }, // Zoom effect on hover
          }} key={item._id}
        > 
                        <CardContent sx={{ pt: 2, pb: 1, flexGrow: 1 }}>
                {/* Circular Image Container - Fixed Size */}
                <Box
                  sx={{
                    position: "relative",
                    width: { xs: 100, sm: 120, md: 140 },
                    height: { xs: 100, sm: 120, md: 140 },
                    borderRadius: "50%",
                    overflow: "hidden",
                    margin: "auto",
                    bgcolor: "#f5f5f5",
                    border: "4px solid #fff",
                    boxShadow: 1,
                  }}
                >
                  {item.image ? (
                    <Image
                      src={`/api/images/category/${item.image}`}
                      alt={item?.name?.[language] || item?.name?.en || 'Category'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      priority={false}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t('noImage')}
                    </Typography>
                  )}
                </Box>

                {/* Title - Fixed Spacing */}
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  sx={{
                    mt: 2,
                    minHeight: 48, // Ensures consistent height for 1-2 lines
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordWrap: "break-word",
                  }}
                >
                  {item?.name?.[language] || item?.name?.en || t('category')}
                </Typography>
              </CardContent>
        </Card>
        ))}
      </Slider>
    </Box>
  );
};

export default CategorySlider;
