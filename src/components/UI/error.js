'use client';
import { useTranslation } from "../../contexts/translationContext"; // Import useTranslation
import { Box, Button, Typography } from '@mui/material';

export default function Error({ error, reset }) {
    const { t } = useTranslation();
    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
            {error || 'Something went wrong!'}
        </Typography>
        <Button 
            onClick={reset} 
            variant="contained" 
            color="primary"
        >
            {t('tryAgain')}
        </Button>
        </Box>
    );
}