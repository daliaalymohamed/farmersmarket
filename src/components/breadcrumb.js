"use client";

import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import { Typography, Breadcrumbs, Link } from '@mui/material';
import NextLink from 'next/link';
import HomeIcon from '@mui/icons-material/Home';

const Breadcrumb = ({ sideNavItem, href, urlText }) => {
    const { t } = useTranslation();
    return (
        <Breadcrumbs separator="›" aria-label="breadcrumb">
            <Link
                component={NextLink}
                href="/dashboard"
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center' }}
            >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                {t('dashboard')}
            </Link>
            <Link
                component={NextLink}
                href={href}
                underline="hover"
                color="inherit"
            >
                {sideNavItem}
            </Link>
            <Typography color="text.primary">
                {urlText}
            </Typography>
            
        </Breadcrumbs>
    )
}

export default Breadcrumb;