"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // Import Redux hooks
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { Box, Card, CardContent, Typography, IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import Image from "next/image";
// import fruitsVeg from '../../uploads/fruits&Veg.jpg';
// import ButcheryPoltery from '../../uploads/Butchery&Poltery.jpg';
// import BakeryCakes from '../../uploads/Bakery & Cakes.webp';
// import spices from '../../uploads/spices.jpeg';
// import plasticsGlass from '../../uploads/plastics&glass.jpg';
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import { fetchCategories } from "@/store/slices/categorySlice";

// Custom Arrow Component
const CustomPrevArrow = ({ onClick }) => (
    <IconButton
      onClick={onClick}
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
  
  const CustomNextArrow = ({ onClick }) => (
    <IconButton
      onClick={onClick}
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

const CategorySlider = () => {
  const dispatch = useDispatch()
  const { t, language } = useTranslation()
  // Combine selectors to optimize re-renders
  const { items: categories = [], loading, error } = useSelector((state) => state.categories) || {};
  console.log(categories)
 

  // ✅ Fetch categories only if empty
  useEffect(() => {
    if (!categories.length) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);
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
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
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
        {categories.map((item) => (
          <Card
          sx={{
            textAlign: "center",
            cursor: "pointer",
            transition: "transform 0.3s",
            "&:hover": { transform: "scale(1.05)" }, // Zoom effect on hover
          }} key={item.id}
        > 
          <CardContent>
            {/* Circular Image Container */}
            <Box
              sx={{
                position: "relative",
                width: "150px", // Adjust the size of the circle
                height: "150px", // Adjust the size of the circle
                borderRadius: "50%", // Makes the container circular
                overflow: "hidden", // Ensures the image stays within the circle
                margin: "auto", // Centers the container
              }}
            >
              {item.img ? (
                  <Image
                    src={""}
                    alt={language === "en" ? item.name.en : item.name.ar}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }} 
                    priority
                  />
                ) : (
                  <Typography variant="caption" sx={{ mt: 2 }}>No Image Available</Typography>
                )}
            </Box>
    
            {/* Title */}
            <Typography variant="h6" sx={{ mt: 2 }}>
              {language === "en" ? item.name.en : item.name.ar}
            </Typography>
          </CardContent>
        </Card>
        ))} 
      </Slider>
    </Box>
  );
};

export default CategorySlider;
