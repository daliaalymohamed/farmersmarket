// components/headerBox.js
'use client';
import React, { useState } from 'react';
import { useTranslation } from '../contexts/translationContext';
import Image from 'next/image';
import { Box, Typography, TextField, InputAdornment, Paper, List, ListItem, ListItemText } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import banner from '../assets/banner.jpg';
import { useRouter } from 'next/navigation';

const HeaderBox = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(inputValue)}&limit=6`);
      const data = await res.json();

      if (data.results?.length > 0) {
        const item = data.results[0];
        if (item.type === 'product') {
          router.push(`/product/${item.slug || item.id}`);
        } else if (item.type === 'category') {
          router.push(`/category/${item.slug || item.id}`);
        }
      } else {
        // No match? Show all products with search term
        router.push(`/home?search=${encodeURIComponent(inputValue)}`);
      }
    } catch (err) {
      console.error('Search failed:', err);
      router.push(`/home?search=${encodeURIComponent(inputValue)}`);
    }

    setInputValue('');
    setResults([]);
  };

  const handleChange = async (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length === 0) {
      setResults([]);
      return;
    }

    if (value.length > 2) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=5`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        setResults([]);
      }
    } else {
      setResults([]);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, width: "100%", gap: 2, mt: 4 }}>
      {/* Image Side */}
      <Box sx={{
        flex: { xs: 'none', md: '1 1 50%' },
        minWidth: "250px",
        position: "relative",
        aspectRatio: { xs: '16/9', md: '16/9' },
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Image src={banner} alt={t("farmersMarket")} fill style={{ objectFit: "cover" }} priority />
      </Box>

      {/* Text & Search Side */}
      <Box sx={{
        flex: { xs: 'auto', md: '1 1 50%' },
        minWidth: "250px",
        height: { xs: "auto", md: "500px" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 3,
        bgcolor: "#fff",
        p: 2,
        borderRadius: "8px"
      }}>
        <Typography variant="h2" sx={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, textAlign: "center", maxWidth: "80%" }}>
          {t("From Our Store to Your Door")}
        </Typography>

        <Typography variant="h5" sx={{ color: "text.secondary", letterSpacing: 2, textAlign: "center", maxWidth: "80%" }}>
          {t("Fast & smooth shopping experience")}
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
          <TextField
            fullWidth
            placeholder={t("searchProductsOrCategories")}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            variant="outlined"
            size="medium"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f5f5f5' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Dropdown Results */}
          {results.length > 0 && (
            <Paper elevation={4} sx={{ position: 'absolute', width: '100%', zIndex: 10, mt: 1 }}>
              <List dense>
                {results.map((item) => (
                  <ListItem
                    key={`${item.type}-${item.id}`}
                    button
                    onClick={() => {
                      if (item.type === 'product') {
                        router.push(`/product/${item.slug || item.id}`);
                      } else {
                        router.push(`/category/${item.slug || item.id}`);
                      }
                    }}
                  >
                    <ListItemText
                      primary={item.name_en}
                      secondary={item.type === 'product' ? `$${item.price?.toFixed(2)}` : `[Category]`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HeaderBox;