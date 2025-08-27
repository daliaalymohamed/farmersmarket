'use client';
import { useTranslation } from "../../contexts/translationContext"; // Import useTranslation
import { Box, Button, Typography } from '@mui/material';

export default function Error({ error }) {
    const { t } = useTranslation();

    // Forch refresh the page when error happen
    const handleTryAgain = () => {
        window.location.reload(); // Always reload the page
    };
    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
            {error || t('somthingWentWrong')}
        </Typography>
        <Button 
            onClick={handleTryAgain} 
            variant="contained" 
            color="primary"
        >
            {t('tryAgain')}
        </Button>
        </Box>
    );
}