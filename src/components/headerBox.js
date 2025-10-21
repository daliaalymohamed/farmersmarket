'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../contexts/translationContext';
import Image from 'next/image';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  ListItemText,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress';
import banner from '../assets/banner.jpg';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { searchService } from '@/services/searchService';

const HeaderBox = () => {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      const query = inputValue.trim();

      if (!query) return;

      setLoading(true);

      try {
        const data = await searchService.quickSearch(query);

        if (data.success && data.results?.length > 0) {
          const item = data.results[0];
          const path = item.type === 'product' ? `/product/${item.slug}` : `/category/${item.slug}`;
          router.push(path);
          setInputValue('');
          setResults([]);
          setFocusedIndex(-1);
        } else {
          toast.info(t('noResultsFound') || 'No results found');
        }
      } catch (err) {
        console.error('Search failed:', err);
        toast.error(t('searchFailed') || 'Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [inputValue, router, t]
  );

  // Handle input changes with debounce "Prevents unnecessary requests"
  // A request is not sent on every keystroke
  // Instead, it waits 300ms after the user stops typing
  // If they type again within 300ms → previous timer is canceled
  // abortController adds a second layer of defense:
  // If a request was in flight when user types again → it gets canceled immediately
  // Prevents old slow responses from overriding newer results
  const handleChange = useCallback(
    async (e) => {
      const value = e.target.value;
      setInputValue(value);
      setFocusedIndex(-1); // Reset on input change

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (value.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      if (value.length > 2) {
        setLoading(true);

        abortControllerRef.current = new AbortController();

        searchTimeoutRef.current = setTimeout(async () => {
          try {
            const data = await searchService.autocomplete(value, 5);
            if (data.success) {
              setResults(data.results || []);
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Autocomplete error:', err);
            }
            setResults([]);
          } finally {
            setLoading(false);
          }
        }, 300);
      } else {
        setResults([]);
        setLoading(false);
      }
    },
    []
  );

  const handleResultClick = useCallback(
    (item) => {
      const path = item.type === 'product' ? `/product/${item.slug}` : `/category/${item.slug}`;
      router.push(path);
      setInputValue('');
      setResults([]);
      setFocusedIndex(-1);
    },
    [router]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!results.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) {
            handleResultClick(results[focusedIndex]);
          } else if (inputValue.trim()) {
            handleSearch(e);
          }
          break;
        case 'Escape':
          setResults([]);
          setFocusedIndex(-1);
          break;
      }
    },
    [results, focusedIndex, inputValue, handleResultClick, handleSearch]
  );

  // Update active descendant when focused index changes
  useEffect(() => {
    if (focusedIndex >= 0 && results[focusedIndex]) {
      const el = document.getElementById(`result-${results[focusedIndex].id}`);
      if (el && suggestionsRef.current?.contains(el)) {
        el.focus(); // Optional: Focus the item
      }
    }
  }, [focusedIndex, results]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        width: '100%',
        gap: 2,
        mt: 4
      }}
    >
      {/* Image Side */}
      <Box
        sx={{
          flex: { xs: 'none', md: '1 1 50%' },
          minWidth: '250px',
          position: 'relative',
          aspectRatio: { xs: '16/9', md: '16/9' },
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <Image
          src={banner}
          alt={t('farmersMarket')}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 600px"
          style={{ objectFit: 'cover' }}
          priority
        />
      </Box>

      {/* Text & Search Side */}
      <Box
        sx={{
          flex: { xs: 'auto', md: '1 1 50%' },
          minWidth: '250px',
          height: { xs: 'auto', md: '500px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3,
          bgcolor: '#fff',
          p: 2,
          borderRadius: '8px'
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center',
            maxWidth: '80%'
          }}
        >
          {t('From Our Store to Your Door')}
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: 'text.secondary',
            letterSpacing: 2,
            textAlign: 'center',
            maxWidth: '80%'
          }}
        >
          {t('Fast & smooth shopping experience')}
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder={t('searchProductsOrCategories')}
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              variant="outlined"
              size="medium"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-controls="search-suggestions-list"
              aria-activedescendant={focusedIndex >= 0 ? `result-${results[focusedIndex]?.id}` : ''}
              inputProps={{
                'aria-label': t('searchProductsOrCategories')
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f5f5f5' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: loading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
          </form>

          {/* Dropdown Results */}
          {results.length > 0 && (
            <Paper
              id="search-suggestions-list"
              ref={suggestionsRef}
              elevation={4}
              role="listbox"
              aria-label={t('searchSuggestions')}
              sx={{
                position: 'absolute',
                width: '100%',
                zIndex: 1300,
                mt: 1,
                maxHeight: '400px',
                overflow: 'auto',
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,.2)',
                  borderRadius: '4px'
                }
              }}
            >
              {results.map((item, index) => (
                <Box
                  key={`${item.type}-${item.id}`}
                  component="div"
                  id={`result-${item.id}`}
                  role="option"
                  tabIndex={-1}
                  onClick={() => handleResultClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleResultClick(item);
                    }
                  }}
                  aria-selected={index === focusedIndex}
                  sx={{
                    cursor: 'pointer',
                    '&:hover, &.Mui-focused': { bgcolor: 'action.hover' },
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ flex: 1 }}>
                      <ListItemText
                        primary={language === 'ar' ? item.name_ar : item.name_en}
                        secondary={
                          item.type === 'product'
                            ? `$${(item.salePrice || item.price)?.toFixed(2)}`
                            : null
                        }
                        slotProps={{
                          primary: {
                            dir: language === 'ar' ? 'rtl' : 'ltr',
                            fontSize: '0.95rem',
                            fontWeight: 500
                          },
                          secondary: {
                            dir: language === 'ar' ? 'rtl' : 'ltr',
                            fontSize: '0.85rem',
                            color: 'success.main'
                          }
                        }}
                      />
                    </Box>
                    <Chip
                      label={item.type === 'product' ? t('product') : t('category')}
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HeaderBox;