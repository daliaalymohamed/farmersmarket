"use client";
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image"; // Import Next.js Image
import { Box, Card, CardContent, CardActionArea, Typography, IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import tomato from '../assets/tomato.jpg';
import ribeyesteak from '../assets/RibeyeSteak.jpeg';
import fourseason from '../assets/fourseason.webp';
import thyme from '../assets/Thyme.jpg';
import spatula from '../assets/spatula.jpg';
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation

const items = [
  { id: 1, en_title: "Buy 2 kilos of Tomato get 1 extra", ar_title: "أشتري 2 كيلو طماطم أحصل على 1 إضافي", img: tomato },
  { id: 2, en_title: "Ribeye Offer", ar_title: "عرض ال ريب آي", img: ribeyesteak },
  { id: 3, en_title: "Four Season Cake", ar_title: "عرض ال فور سيزونز", img: fourseason },
  { id: 4, en_title: "Thyme", ar_title: "عرض الزعتر", img: thyme },
  { id: 5, en_title: "Bye 1 get 1 free", ar_title: "أشتري 1 و أحصل على الثانية مجانآ", img: spatula }
];


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

const DealsSlider = () => {
  const { t, language } = useTranslation()

  // slider slick settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4, // Number of items visible at a time
    slidesToScroll: 1,
    cssEase: "ease-in-out", // Makes the scroll smoother
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
          {t("topDeals")}
      </Typography>
      <Slider {...settings}>
        {items.map((item) => (
            <Box key={item.id} sx={{ px: 1 }}> {/* Add horizontal padding */}
                <Card sx={{ maxWidth: 345, textAlign: "center",
                    cursor: "pointer",
                    transition: "transform 0.3s",
                    "&:hover": { transform: "scale(1.05)" } 
                    }} key={item.id}
                    >
                    <CardActionArea>
                        <Box sx={{ position: "relative", width: "100%", height: 140 }}>
                            <Image
                                src={item.img}
                                alt={language === "en" ? item.en_title : item.ar_title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                style={{ objectFit: "cover" }}
                            />
                        </Box>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                {language === "en" ? item.en_title : item.ar_title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Lizards are a widespread group of squamate reptiles, with over 6,000
                            species, ranging across all continents except Antarctica
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default DealsSlider;
