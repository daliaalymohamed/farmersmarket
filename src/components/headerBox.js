'use client';
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import Image from "next/image";
import { Box, Typography } from '@mui/material';
import main from '../assets/main.jpg'

const HeaderBox = () => {
    const { t } = useTranslation();  // Get the translation function

    const Item = ({ children, sx }) => (
        <Box
          sx={{
            bgcolor: "#fff",
            p: 2,
            textAlign: "center",
            borderRadius: "8px",
            flex: "1 1 auto",
            minWidth: "150px",
            ...sx,
          }}
        >
          {children}
        </Box>
      );
    return (
        <>
            {/* First row with two fixed items */}
            <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" }, // Stack on small screens
                width: "100%",
                height: "auto",
                gap: 2,
            }}
            >
            {/* Image container with fixed aspect ratio */}
            <Item
                sx={{
                flex: "1 1 50%",
                minWidth: "250px",
                position: "relative",
                aspectRatio: "16/9", // Ensures image stays visible
                }}>
                <Image
                src={main}
                alt="Farmer's Market"
                fill
                sizes="(max-width: 768px) 100vw, 50vw" // Add this line
                style={{ objectFit: "cover", borderRadius: "50%" }}
                priority
                />
            </Item>
                <Item
                sx={{
                flex: "1 1 50%",
                minWidth: "250px",
                height: { xs: "auto", md: "500px" }, // Adjust height on mobile
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                bgcolor: "#fff",
                }}
            >
                <Typography
                variant="h2"
                sx={{
                    fontWeight: "bold",
                    color: "text.primary",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    textAlign: "center",
                    maxWidth: "80%",
                }}
                >
                {t("From Our Store to Your Door")}
                </Typography>
                <Typography variant="h5"
                sx={{
                    color: "text.secondary",
                    letterSpacing: 2,
                    textAlign: "center",
                    maxWidth: "80%",
                }}>
                    {t("Fast & smooth shopping experience")}
                </Typography>
            </Item>
            </Box>
        </>
    )
}

export default HeaderBox;