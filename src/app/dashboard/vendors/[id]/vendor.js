'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../contexts/translationContext';
import Dashboard from '@/components/dashboard';
import Link from 'next/link';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Tab,
  Tabs,
  Stack,
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import WarningIcon from '@mui/icons-material/Warning';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { updateVendorInList, selectVendorById, toggleVendorActiveStatus } from '@/store/slices/vendorSlice';
import VendorModal from './vendorModal';
import Breadcrumb from "@/components/UI/breadcrumb";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";

const Vendor = ({ initialData }) => {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
  
    const dispatch = useDispatch();

    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.vendors?.loading || false);
    const error = useSelector(state => state.vendors?.error || null);

    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_vendor", "toggle_vendor_status", "edit_vendor"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        if (!hasAccess) {
        router.push("/home");
        }
    }, [actions, actionsLoaded ,router]);

    // Get vendor from Redux store or fall back to initialData
    const vendorData = useSelector(state => {
        const reduxVendor = selectVendorById(state, initialData?._id);
        // Only use initialData if Redux doesn't have the vendor yet
        return reduxVendor || initialData;
    }, shallowEqual);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData?._id) {
            dispatch(updateVendorInList(initialData));
        }
    }, [dispatch, initialData]); 

    const {
        name,
        contactPhone,
        location,
        about,
        socialLinks,
        createdBy,
        updatedBy,
        active,
        createdAt,
        updatedAt
    } = vendorData;

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // handle edit click
    // useCallback to prevent unnecessary re-renders
    const handleEdit = useCallback((vendor) => {
        setModalOpen(true);
        setSelectedVendor(vendor);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000); // Simulate API call
    }, []);

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedVendor(null);
    };

    // Handle toggle active status
    const handleToggleActive = async () => {
        if (loading || isUpdating) return; // Prevent multiple clicks
        setIsUpdating(true);

        try {
            // Pass current status from vendorData
            const result = await dispatch(
                toggleVendorActiveStatus({
                    vendorId: vendorData._id,
                    active: !vendorData.active // Toggle the current state
                })
            ).unwrap(); // Use unwrap() to handle the promise properly

             // Explicitly update the local state with the full response
            if (result?.vendor) {
                dispatch(updateVendorInList(result.vendor));
            }

            // Only show success toast - errors are handled by interceptor
            toast.success(t('vendorStatusUpdatedSuccessfully'));
            // toast.success(result.message); // Show message from server if needed
          
        } catch (error) {
          // DO NOT show toast here. Axios interceptor already did it.
        } finally {
          setIsUpdating(false);
        }
      };

    if (!vendorData) {
        return null;
    }

    
    // Trim URL function to display social links
    // This function trims the URL to a maximum of 10 characters for display purposes
    // If the URL is invalid, it returns a shortened version of the original URL
    const trimUrl = (url) => {
        try {
            const u = new URL(url);
            return u.hostname.replace('www.', '') + u.pathname.replace(/\/$/, '').substring(0, 15);
        } catch {
            return url.length > 20 ? url.slice(0, 20) + '...' : url;
        }
    };

    return (
        <Dashboard>
            <VendorModal
                open={modalOpen}
                handleClose={handleCloseModal}
                vendor={selectedVendor}
                language={language}
                t={t}
                loading={loading}
            />
            <Box sx={{ p: 3 }}>
                {/* Breadcrumb */}
                <Breadcrumb 
                sideNavItem={t("vendors")} 
                href="/dashboard/vendors/list" 
                urlText={t("vendorDetails")}
                ariaLabel="/dashboard/vendors/list" 
                />

                {loading ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Loading />
                </Paper>
                ) : error ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Error message={error} />
                </Paper>
                ) : !vendorData ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">
                    {t('vendorNotFound')}
                    </Typography>
                    <Button 
                        onClick={() => router.push('/dashboard/vendors/list')}
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                    {t('goBack')}
                    </Button>
                </Paper>
                ) : (
                <>
                    {/* Header Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={4} alignItems="center">
                            <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                {/* Vendor Info */}
                                <Box>
                                    <Typography variant="h4">
                                        {name || 'Unnamed Vendor'}
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Chip 
                                            label={active === true ? t('active') : t('inactive')}
                                            color={active === true ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('addedOn')}: {new Date(createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('updatedOn')}: {new Date(updatedAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                        </Grid>
                        <Grid
                                xs={12}
                                md={4}
                                sx={{
                                    display: 'flex!important',
                                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                    mt: { xs: 2, md: 0 },
                                    gap: 2,
                                }}
                                >
                                {
                                    !active  && (
                                        <Chip 
                                            label={t('inactiveWarningVendor')}
                                            color="error"
                                            size="medium"
                                            sx={{ fontWeight: 'bold' }}
                                            icon={<WarningIcon />}
                                        />
                                )
                            }  
                            {
                                active && (
                                    <Button 
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleEdit(vendorData)}
                                        disabled={loading || isUpdating}
                                        startIcon={(loading || isUpdating) ? <ButtonLoader /> : <EditIcon />}
                                    >
                                        {(loading || isUpdating) ? t('updating') : t('editVendor')}
                                    </Button>
                                )
                            }
                                <Button 
                                    variant="contained"
                                    color={active ? 'error' : 'success'}
                                    onClick={handleToggleActive}
                                    disabled={loading || isUpdating}
                                    startIcon={(loading || isUpdating) ? <ButtonLoader /> : null}
                                >
                                    {(loading || isUpdating) ? t('updating') : active ? t('deactivate') : t('activate')}
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => router.back()}
                                >
                                    {t('goBack')}
                                </Button>
                                </Grid>
                        </Grid>
                    </Paper>
                    
                    {/* Tabs Navigation */}
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    >
                        <Tab label={t('basicInfo')} />
                    </Tabs>

                    {/* Tab Panels */}
                    {/* Basic Info Tab */}
                    {activeTab === 0 && (
                        <Paper sx={{ p: 3 }}>
                        <Grid container spacing={4}>
                            {/* Vendor Information */}
                            <Grid xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>
                                {t('vendorInformation')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon color="primary" />
                                    <Typography color="text.secondary">
                                        {t('contactPhone')}: {contactPhone || t('unknown')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon color="primary" />   
                                    <Typography color="text.secondary">
                                        {t('location')}: {location || t('unknown')}
                                    </Typography>
                                </Box>
                            </Box>
                            </Grid>
                            <Grid xs={12} md={4} sx={{ mt: { xs: 2, md: 0 } }}>
                                <Typography variant="h6" gutterBottom>
                                {t('additionalInfo')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography color="text.secondary">
                                        {t('createdBy')}: {createdBy?.firstName || t('unknown')}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {t('updatedBy')}: {updatedBy?.firstName || t('unknown')}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* about */}
                            <Grid xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                {t('aboutVendor')}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {about || t('noData')} 
                            </Typography>
                            </Grid>
                        </Grid>
                        </Paper>
                    )}

                    {/* Social Links */}
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('socialLinks')}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {/* Facebook */}
                            {socialLinks?.facebook ? (
                                <Link
                                    href={socialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${t('openFacebookPageFor')} ${name}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Chip
                                    icon={<Facebook fontSize="small" />}
                                    label={trimUrl(socialLinks.facebook)}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    clickable
                                    sx={{
                                            '&:hover': {
                                                bgcolor: 'primary.light',
                                                color: 'primary'
                                            }
                                    }}
                                    />
                                </Link>
                            ) : (
                                <Chip
                                    icon={<Facebook fontSize="small" />}
                                    label={t('noFaceBookAccount')}
                                    variant="outlined"
                                    size="small"
                                    sx={{ 
                                        color: 'text.secondary', 
                                        borderColor: 'divider'
                                    }}
                                />
                            )}

                            {/* Instagram */}
                            {socialLinks?.instagram ? (
                                <Link
                                    href={socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${t('openInstagramPageFor')} ${name}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Chip
                                    icon={<Instagram fontSize="small" />}
                                    label={trimUrl(socialLinks.instagram)}
                                    color="error"
                                    variant="outlined"
                                    size="small"
                                    clickable
                                    sx={{
                                        '&:hover': {
                                            bgcolor: 'error.light',
                                            color: 'error'
                                        }
                                    }}
                                    />
                                </Link>
                                ) : (
                                <Chip
                                    icon={<Instagram fontSize="small" />}
                                    label={t('noInstagramAccount')}
                                    variant="outlined"
                                    size="small"
                                    sx={{ 
                                        color: 'text.secondary', 
                                        borderColor: 'divider'
                                    }}
                                />
                            )}
                        </Stack>
                    </Paper>
                </>
                )}
            </Box>
        </Dashboard>
    );
};

export default memo(withAuth(Vendor));