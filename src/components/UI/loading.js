'use client';
import { useTranslation } from "../../contexts/translationContext"; // Import useTranslation
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading() {
    const { t } = useTranslation();
    
    return (
        <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('loading')}</Typography>
        </Box>
    );
}