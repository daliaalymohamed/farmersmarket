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
    Skeleton
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { updateZoneInList, selectZoneById, toggleZoneActiveStatus } from '@/store/slices/shippingZonesSlice';
import Breadcrumb from "@/components/UI/breadcrumb";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';
const ZoneModal = dynamic(() => import('./shippingZoneModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});

const ShippingZone = ({ initialData }) => {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
  
    const dispatch = useDispatch();

    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.zones?.loading || false);
    const error = useSelector(state => state.zones?.error || null);

    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_shipping_zone", "toggle_shipping_zone_status", "edit_shipping_zone"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        if (!hasAccess) {
        router.push("/home");
        }
    }, [actions, actionsLoaded ,router]);

    // Get zone from Redux store or fall back to initialData
    const zoneData = useSelector(state => {
        const reduxZone = selectZoneById(state, initialData?._id);
        // Only use initialData if Redux doesn't have the zone yet
        return reduxZone || initialData;
    }, shallowEqual);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData?._id) {
            dispatch(updateZoneInList(initialData));
        }
    }, [dispatch, initialData]); 

    const {
        name,
        zipCodes,
        cityNames,
        shippingFee,
        taxRate,
        country,
        createdBy,
        updatedBy,
        active,
        createdAt,
        updatedAt
    } = zoneData;

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // handle edit click
    // useCallback to prevent unnecessary re-renders
    const handleEdit = useCallback((vendor) => {
        setModalOpen(true);
        setSelectedZone(vendor);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000); // Simulate API call
    }, []);

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedZone(null);
    };

    // Handle toggle active status
    const handleToggleActive = async () => {
        if (loading || isUpdating) return; // Prevent multiple clicks
        setIsUpdating(true);

        try {
            // Pass current status from zoneData
            const result = await dispatch(
                toggleZoneActiveStatus({
                    zoneId: zoneData._id,
                    active: !zoneData.active // Toggle the current state
                })
            ).unwrap(); // Use unwrap() to handle the promise properly

             // Explicitly update the local state with the full response
            if (result?.zone) {
                dispatch(updateZoneInList(result.zone));
            }

            // Only show success toast - errors are handled by interceptor
            toast.success(t('zoneStatusUpdatedSuccessfully'));
            // toast.success(result.message); // Show message from server if needed
          
        } catch (error) {
          // DO NOT show toast here. Axios interceptor already did it.
        } finally {
          setIsUpdating(false);
        }
      };

    if (!zoneData) {
        return null;
    }

    return (
        <Dashboard>
            <ZoneModal
                open={modalOpen}
                handleClose={handleCloseModal}
                zone={selectedZone}
                language={language}
                t={t}
                loading={loading}
            />
            <Box sx={{ p: 3 }}>
                {/* Breadcrumb */}
                <Breadcrumb 
                    sideNavItem={t("shippingZones")} 
                    href="/dashboard/shipping-zones/list" 
                    urlText={t("shippingZoneDetails")}
                    ariaLabel="/dashboard/shipping-zones/list" 
                />

                {loading ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Loading />
                </Paper>
                ) : error ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Error message={error} />
                </Paper>
                ) : !zoneData ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">
                    {t('zoneNotFound')}
                    </Typography>
                    <Button 
                        onClick={() => router.push('/dashboard/shipping-zones/list')}
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
                                {/* Zone Info */}
                                <Box>
                                    <Typography variant="h4">
                                        {name?.[language] || name?.en || name?.ar || 'Unnamed Zone'}
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
                                {!active && (
                                    <Chip 
                                        label={t('inactiveWarningZone')}
                                        color="error"
                                        size="medium"
                                        sx={{ fontWeight: 'bold' }}
                                        icon={<WarningIcon />}
                                    />
                                )}  
                                {active && (
                                    <Button 
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleEdit(zoneData)}
                                        disabled={loading || isUpdating}
                                        startIcon={(loading || isUpdating) ? <ButtonLoader /> : <EditIcon />}
                                    >
                                        {(loading || isUpdating) ? t('updating') : t('editZone')}
                                    </Button>
                                )}
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
                                {/* Zone Information */}
                                <Grid xs={12} md={8}>
                                    <Typography variant="h6" gutterBottom>
                                        {t('zoneInformation')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Shipping Fee */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography fontWeight="bold" color="text.primary">
                                                {t('shippingFee')}:
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {shippingFee ? `${shippingFee} ${t('EGP')}` : t('unknown')}
                                            </Typography>
                                        </Box>

                                        {/* Tax Rate */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography fontWeight="bold" color="text.primary">
                                                {t('taxRate')}:
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {taxRate ? `${(taxRate * 100).toFixed(2)}%` : t('unknown')}
                                            </Typography>
                                        </Box>

                                        {/* Country */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography fontWeight="bold" color="text.primary">
                                                {t('country')}:
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {country || t('unknown')}
                                            </Typography>
                                        </Box>

                                        {/* ZIP Codes */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Typography fontWeight="bold" color="text.primary">
                                                {t('zipCodes')}:
                                            </Typography>
                                            <Box>
                                                {zipCodes && zipCodes.length > 0 ? (
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {zipCodes.slice(0, 10).map((zip, index) => (
                                                            <Chip 
                                                                key={index} 
                                                                label={zip} 
                                                                size="small" 
                                                                variant="outlined" 
                                                            />
                                                        ))}
                                                        {zipCodes.length > 10 && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                +{zipCodes.length - 10} more
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    <Typography color="text.secondary">{t('noZipCodes')}</Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Cities */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Typography fontWeight="bold" color="text.primary">
                                                {t('cities')}:
                                            </Typography>
                                            <Box>
                                                {cityNames && cityNames.length > 0 ? (
                                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                        {cityNames.slice(0, 8).map((city, index) => (
                                                            <Chip 
                                                                key={index} 
                                                                label={city[language] || city.en || city.ar} 
                                                                size="small" 
                                                                variant="outlined" 
                                                            />
                                                        ))}
                                                        {cityNames.length > 8 && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                +{cityNames.length - 8} more
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    <Typography color="text.secondary">{t('noCities')}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Additional Info Section */}
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
                                        
                                        {/* Status */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography fontWeight="bold" color="text.primary">
                                                {t('status')}:
                                            </Typography>
                                            <Chip 
                                                label={active ? t('active') : t('inactive')}
                                                color={active ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </>
                )}
            </Box>
        </Dashboard>
    );
};

export default memo(withAuth(ShippingZone));