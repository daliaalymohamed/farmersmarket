// export default HeaderBox;
'use client';
import { useTranslation } from "../contexts/translationContext";
import Image from "next/image";
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import banner from '../assets/banner.jpg';

const HeaderBox = () => {
  const { t } = useTranslation();

  const Item = ({ children, sx }) => (
    <Box
      sx={{
        bgcolor: "#fff",
        p: 2,
        textAlign: "center",
        borderRadius: "8px",
        flex: "1 1 auto",
        minWidth: "250px",
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
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          gap: 2,
          mt: 4,
        }}
      >
        {/* Image Side */}
        <Item
          sx={{
            flex: "1 1 50%",
            minWidth: "250px",
            position: "relative",
            aspectRatio: "16/9",
          }}
        >
          <Image
            src={banner}
            alt={t("farmersMarket")}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover", borderRadius: "5%" }}
            priority
          />
        </Item>

        {/* Text & Search Side */}
        <Item
          sx={{
            flex: "1 1 50%",
            minWidth: "250px",
            height: { xs: "auto", md: "500px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 3, // Space between elements
            bgcolor: "#fff",
          }}
        >
          {/* Headline */}
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

          {/* Subtitle */}
          <Typography
            variant="h5"
            sx={{
              color: "text.secondary",
              letterSpacing: 2,
              textAlign: "center",
              maxWidth: "80%",
            }}
          >
            {t("Fast & smooth shopping experience")}
          </Typography>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder={t("searchProducts")}
            autoFocus
            autoComplete="true"
            variant="outlined"
            size="medium"
            sx={{
              maxWidth: "400px",
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#f5f5f5',
                '&:hover': {
                  bgcolor: '#eeeeee',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            aria-label={t("searchProducts")}
          />
        </Item>
      </Box>
    </>
  );
};

export default HeaderBox;