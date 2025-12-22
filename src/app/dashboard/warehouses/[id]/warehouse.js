'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../contexts/translationContext';
import Dashboard from '@/components/dashboard';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Button,
    Tab,
    Tabs,
    Stack,
    Skeleton,
    Divider,
    Grid as MuiGrid
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MailIcon from '@mui/icons-material/Mail';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import StorageIcon from '@mui/icons-material/Storage';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { updateWarehouseInList, selectWarehouseById, toggleWarehouseActiveStatus } from '@/store/slices/warehouseSlice';
import Breadcrumb from "@/components/UI/breadcrumb";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';

const WarehouseModal = dynamic(() => import('../warehouseModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false
});

const Warehouse = ({ initialData }) => {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  
    const dispatch = useDispatch();

    // Redux Selectors
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.warehouses?.loading || false);
    const error = useSelector(state => state.warehouses?.error || null);

    useEffect(() => {
        if (!actionsLoaded) return;

        const requiredPermissions = ["view_warehouse", "toggle_warehouse_status", "edit_warehouse"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Get warehouse from Redux store or fall back to initialData
    const warehouseData = useSelector(state => {
        const reduxWarehouse = selectWarehouseById(state, initialData?._id);
        return reduxWarehouse || initialData;
    });

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData?._id) {
            dispatch(updateWarehouseInList(initialData));
        }
    }, [dispatch, initialData]); 

    const {
        name,
        address,
        contactInfo,
        capacity,
        managerId,
        active,
        createdAt,
        updatedAt
    } = warehouseData || {};

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Handle edit click
    const handleEdit = useCallback((warehouse) => {
        setModalOpen(true);
        setSelectedWarehouse(warehouse);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000);
    }, []);

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedWarehouse(null);
    };

    // Handle toggle active status
    const handleToggleActive = async () => {
        if (loading || isUpdating) return;
        setIsUpdating(true);

        try {
            const result = await dispatch(
                toggleWarehouseActiveStatus({
                    warehouseId: warehouseData._id,
                    active: !warehouseData.active
                })
            ).unwrap();

            // Update Redux with the returned warehouse data
            if (result?.warehouse) {
                dispatch(updateWarehouseInList(result.warehouse));
            }

            toast.success(t('warehouseStatusUpdatedSuccessfully'));
          
        } catch (error) {
            toast.error(t('failedToUpdateWarehouseStatus'));
        } finally {
            setIsUpdating(false);
        }
    };

    if (!warehouseData) {
        return null;
    }

    return (
        <Dashboard>
            <WarehouseModal
                open={modalOpen}
                handleClose={handleCloseModal}
                warehouse={selectedWarehouse}
                language={language}
                t={t}
                loading={loading}
            />
            <Box sx={{ p: 3 }}>
                {/* Breadcrumb */}
                <Breadcrumb 
                    sideNavItem={t("warehouses")} 
                    href="/dashboard/warehouses/list" 
                    urlText={t("warehouseDetails")}
                    ariaLabel="/dashboard/warehouses/list" 
                />

                {loading ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Loading />
                    </Paper>
                ) : error ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Error message={error} />
                    </Paper>
                ) : !warehouseData ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">
                            {t('warehouseNotFound')}
                        </Typography>
                        <Button 
                            onClick={() => router.push('/dashboard/warehouses/list')}
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
                                    {/* Warehouse Info */}
                                    <Box>
                                        <Typography variant="h4">
                                            {name || 'Unnamed Warehouse'}
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
                                        !active && (
                                            <Chip 
                                                label={t('inactiveWarningWarehouse')}
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
                                                onClick={() => handleEdit(warehouseData)}
                                                disabled={loading || isUpdating}
                                                startIcon={(loading || isUpdating) ? <ButtonLoader /> : <EditIcon />}
                                            >
                                                {(loading || isUpdating) ? t('updating') : t('editWarehouse')}
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
                            <Tab label={t('addressInfo')} />
                            <Tab label={t('capacity')} />
                        </Tabs>

                        {/* Tab Panels */}
                        {/* Basic Info Tab */}
                        {activeTab === 0 && (
                            <Paper sx={{ p: 3 }}>
                                <Grid container spacing={4}>
                                    {/* Warehouse Information */}
                                    <Grid xs={12} md={8}>
                                        <Typography variant="h6" gutterBottom>
                                            {t('warehouseInformation')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PhoneIcon color="primary" />
                                                <Typography color="text.secondary">
                                                    {t('phone')}: {contactInfo?.phone || t('noContactPhone')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MailIcon color="primary" />
                                                <Typography color="text.secondary">
                                                    {t('email')}: {contactInfo?.email || t('noContactEmail')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon color="primary" />
                                                <Typography color="text.secondary">
                                                    {t('contactPerson')}: {contactInfo?.contactPerson || t('noContactPerson')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid xs={12} md={4} sx={{ mt: { xs: 2, md: 0 } }}>
                                        <Typography variant="h6" gutterBottom>
                                            {t('warehouseManager')}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Typography color="text.secondary">
                                                {managerId?.firstName || t('unknown')} {managerId?.lastName || ''}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('email')}: {managerId?.email || t('unknown')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}

                        {/* Address Info Tab */}
                        {activeTab === 1 && (
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    {t('warehouseAddress')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                            <LocationOnIcon color="primary" sx={{ mt: 0.5 }} />
                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    {t('street')}
                                                </Typography>
                                                <Typography variant="body1">
                                                    {address?.street || t('unknown')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                {t('city')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {address?.city || t('unknown')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                {t('state')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {address?.state || t('unknown')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                {t('zipCode')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {address?.zipCode || t('unknown')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid xs={12}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                {t('country')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {address?.country || t('unknown')}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}

                        {/* Capacity Tab */}
                        {activeTab === 2 && (
                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <StorageIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        {t('storageCapacity')}
                                    </Typography>
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 1 }}>
                                        <Typography variant="h3" color="primary">
                                            {capacity || 0}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {t('units')}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 3 }} />
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'action.hover', 
                                        borderRadius: 1,
                                        mt: 2
                                    }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('totalCapacity')}
                                        </Typography>
                                        <Typography variant="h6" sx={{ mt: 1 }}>
                                            {capacity} {t('units')} {t('available')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                    </>
                )}
            </Box>
        </Dashboard>
    );
};

export default memo(withAuth(Warehouse));
