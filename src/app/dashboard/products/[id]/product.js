'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../contexts/translationContext';
import Dashboard from '@/components/dashboard';
import Image from "next/image";
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
import InventoryIcon from '@mui/icons-material/Inventory';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import WarningIcon from '@mui/icons-material/Warning';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { updateProductInList, selectProductById, toggleProductActiveStatus } from '@/store/slices/productSlice';
import Breadcrumb from "@/components/UI/breadcrumb";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import dynamic from 'next/dynamic';
const ProductModal = dynamic(() => import('../productModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});

const Product = ({ initialData, initialCategories, initialVendors }) => {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const dispatch = useDispatch();

    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.products?.loading || false);
    const error = useSelector(state => state.products?.error || null);

    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded
        
        const requiredPermissions = ["toggle_product_status", "edit_product"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        if (!hasAccess) {
        router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Get product from Redux store or fall back to initialData
    const productData = useSelector(state => {
        const reduxProduct = selectProductById(state, initialData?._id);
        // Only use initialData if Redux doesn't have the product yet
        return reduxProduct || initialData;
    }, shallowEqual);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData?._id) {
            dispatch(updateProductInList(initialData));
        }
    }, [dispatch, initialData]); // Fixed: Include full initialData object

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // handle edit click
    // useCallback to prevent unnecessary re-renders
    const handleEdit = useCallback((product) => {
        setModalOpen(true);
        setSelectedProduct(product);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000); // Simulate API call
    }, []);

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedProduct(null);
    };

    // Handle toggle active status
    const handleToggleActive = async () => {
        if (loading || isUpdating) return; // Prevent multiple clicks
        setIsUpdating(true);

        try {
            // Pass current status from productData
            const result = await dispatch(
                toggleProductActiveStatus({
                    productId: productData._id,
                    isActive: !productData.isActive // Toggle the current state
                })
            ).unwrap(); // Use unwrap() to handle the promise properly

            // Explicitly update the local state with the full response
            if (result?.product) {
                dispatch(updateProductInList(result.product));
            }

            // Only show success toast - errors are handled by interceptor
            toast.success(t('productStatusUpdatedSuccessfully'));
            // toast.success(result.message); // Show message from server if needed
            
        } catch (error) {
            // DO NOT show toast here. Axios interceptor already did it.
        } finally {
            setIsUpdating(false);
        }
    };


    if (!productData) {
        return null;
    }

    const {
        name,
        description,
        image,
        price,
        stock,
        isActive,
        createdAt,
        updatedAt,
        orders = [],
        vendorId,
        categoryId,
        createdBy,
        updatedBy,
        isFeatured,
        isOnSale,
        salePrice,
        saleStart,
        saleEnd,
        tags
    } = productData;
    
    // startDate and endDate function for consistent formatting
    const formatDateTime = (dateString) => {
        if (!dateString) return t('notSet');
        
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    return (
        <Dashboard>
            <ProductModal
                open={modalOpen}
                handleClose={handleCloseModal}
                product={selectedProduct}
                language={language}
                t={t}
                loading={loading}
                categories={initialCategories}
                vendors={initialVendors || []}
            />
            <Box sx={{ p: 3 }}>
                {/* Breadcrumb */}
                <Breadcrumb 
                sideNavItem={t("products")} 
                href="/dashboard/products/list" 
                urlText={t("productDetails")}
                ariaLabel="/dashboard/products/list" 
                />

                {loading ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Loading />
                </Paper>
                ) : error ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Error message={error} />
                </Paper>
                ) : !productData ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">
                    {t('productNotFound')}
                    </Typography>
                    <Button 
                    onClick={() => router.push('/dashboard/products/list')}
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
                            {/* Product Image */}
                            <Box sx={{ position: 'relative', width: 180, height: 180 }}>
                                <Image
                                    src={`/api/images/product/${image}`}
                                    alt={name?.[language] || name?.en || name?.ar || t('product')}
                                    width={180}
                                    height={180}
                                    style={{ 
                                        width: 180,
                                        height: 180,
                                        objectFit: 'cover', 
                                        borderRadius: 2, 
                                        mr: 2,
                                        border: '1px solid #eee',
                                        boxShadow: 1,
                                        background: '#f5f5f5', 
                                    }}
                                    onError={() => console.error(`Failed to load image: ${image}`)}
                                    />
                            </Box>
                            {/* Product Info */}
                            <Box>
                                <Typography variant="h4">
                                    {name?.[language] || name?.en || name?.ar || 'Unnamed Product'}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Chip 
                                        label={isActive ? t('active') : t('inactive')}
                                        color={isActive ? 'success' : 'error'}
                                        size="small"
                                    />
                                    <Chip
                                        icon={<InventoryIcon />}
                                        label={`${stock} ${t('unitsAvailable')}`}
                                        color={stock === 0 ? 'error' : stock < 10 ? 'warning' : 'success'}
                                        size="small"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {t('addedOn')}: {new Date(createdAt).toLocaleDateString()}
                                    </Typography>
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
                                ( !isActive || stock === 0 ) && (
                                    <Chip 
                                        label={t('outOfStockInactiveWarningProduct')}
                                        color="error"
                                        size="medium"
                                        sx={{ fontWeight: 'bold' }}
                                        icon={<WarningIcon />}
                                    />
                                )
                            }  
                            {
                                isActive && stock > 0 && (
                                    <Button 
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleEdit(productData)}
                                        disabled={loading || isUpdating}
                                        startIcon={(loading || isUpdating) ? <ButtonLoader /> : <EditIcon />}
                                    >
                                        {(loading || isUpdating) ? t('updating') : t('editProduct')}
                                    </Button>
                                )
                            }  
                            <Button 
                                    variant="contained"
                                    color={isActive ? 'error' : 'success'}
                                    onClick={handleToggleActive}
                                    disabled={loading || isUpdating}
                                    startIcon={(loading || isUpdating) ? <ButtonLoader /> : null}
                                >
                                    {(loading || isUpdating) ? t('updating') : isActive ? t('deactivate') : t('activate')}
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
                    <Tab label={t('productOrders')} />
                    <Tab label={t('vendorInfo')} /> 
                </Tabs>

                {/* Tab Panels */}
                {/* Basic Info Tab */}
                {activeTab === 0 && (
                    <Paper sx={{ p: 3 }}>
                    <Grid container spacing={4}>
                        {/* Product Information */}
                        <Grid xs={12} md={8}>
                        <Typography variant="h6" gutterBottom>
                            {t('productInformation')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MoneyIcon color="primary"/>
                            <Typography color="text.secondary">
                                {t('EGP')} {t('price')}: {price}
                            </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InventoryIcon color="primary" />
                            <Typography color="text.secondary">
                                {t('stock')}: {stock}
                            </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon color={isActive ? "success" : "error"} />
                            <Typography color="text.secondary">
                                {isActive ? t('active') : t('inactive')}
                            </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CategoryIcon color="primary" />   
                                <Typography color="text.secondary">
                                    {t('category')}: {categoryId?.name?.[language] || categoryId?.name?.en || categoryId?.name?.ar || t('category')}
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
                                <Typography color="text.secondary">
                                    {t('isFeatured')}: {isFeatured ? t('yes') : t('no')}
                                </Typography>
                                <Typography color="text.secondary">
                                    {t('isOnSale')}: {isOnSale ? t('yes') : t('no')}
                                </Typography>
                                {isOnSale && (
                                    <>
                                    <Typography color="text.secondary">
                                        {t('salePrice')}: {salePrice}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {t('saleStart')}: {saleStart ? formatDateTime(saleStart): t('notSet')}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {t('saleEnd')}: {saleEnd ? formatDateTime(saleEnd) : t('notSet')}
                                    </Typography>
                                    </>
                                )}
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography color="text.secondary">
                                        {t('tags')}:
                                    </Typography>
                                    {tags && tags.length > 0 ? (
                                        tags.map((tag, index) => (
                                            <Chip 
                                                key={index} 
                                                label={tag} 
                                                size="small" 
                                                color="primary"
                                            />
                                        ))
                                    ) : (
                                        <Typography color="text.disabled" variant="caption">
                                            {t('noTags')}
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Description */}
                        <Grid xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            {t('productDescription')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {description?.[language] || description?.en || description?.ar || t('description')} 
                        </Typography>
                        </Grid>
                    </Grid>
                    </Paper>
                )}

                {/* Product Orders Tab */}
                {activeTab === 1 && (
                    <Paper sx={{ p: 3 }}>
                    {orders.length > 0 ? (
                        <Grid container spacing={2}>
                        {orders.map((order) => (
                            <Grid xs={12} key={order._id}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle1">
                                {t('orderNumber')}: {order._id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                {t('orderDate')}: {new Date(order.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                {t('orderStatus')}: {order.status}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                {t('quantity')}: {order.quantity}
                                </Typography>
                            </Paper>
                            </Grid>
                        ))}
                        </Grid>
                    ) : (
                        <Typography color="text.secondary" align="center">
                        {t('noOrders')}
                        </Typography>
                    )}
                    </Paper>
                )}

                {/* Vendor Info Tab */}
                {activeTab === 2 && (
                    <Paper sx={{ p: 3 }}>
                        {vendorId ? (
                        <Grid container spacing={4}>
                            {/* Vendor Basic Info */}
                            <Grid xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                {t('basicInfo')}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <InventoryIcon color="primary" sx={{ fontSize: 20 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                    {t('vendorName')}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                    {vendorId.name || t('unnamedVendor')}
                                    </Typography>
                                </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <CategoryIcon color="primary" sx={{ fontSize: 20 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                    {t('location')}
                                    </Typography>
                                    <Typography variant="body1">
                                    {vendorId.location || t('notSpecified')}
                                    </Typography>
                                </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <CheckCircleIcon color={vendorId.active ? "success" : "error"} sx={{ fontSize: 20 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                    {t('status')}
                                    </Typography>
                                    <Typography variant="body1" color={vendorId.active ? 'success.main' : 'error.main'}>
                                    {vendorId.active ? t('active') : t('inactive')}
                                    </Typography>
                                </Box>
                                </Box>

                                {vendorId.about && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t('aboutVendor')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                    {vendorId.about}
                                    </Typography>
                                </Box>
                                )}
                            </Box>
                            </Grid>

                            {/* Contact Information */}
                            <Grid xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                {t('contactInformation')}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                                <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {t('contactPhone')}
                                </Typography>
                                <Typography variant="body1">
                                    <a href={`tel:${vendorId.contactPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {vendorId.contactPhone}
                                    </a>
                                </Typography>
                                </Box>

                                {/* Social Links */}
                                {(vendorId.socialLinks?.facebook || vendorId.socialLinks?.instagram) && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t('socialLinks')}
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                    {vendorId.socialLinks?.facebook && (
                                        <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Facebook fontSize="small" />}
                                        href={vendorId.socialLinks.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        >
                                        {t('facebook')}
                                        </Button>
                                    )}
                                    {vendorId.socialLinks?.instagram && (
                                        <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Instagram fontSize="small" />}
                                        href={vendorId.socialLinks.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        >
                                        {t('instagram')}
                                        </Button>
                                    )}
                                    </Stack>
                                </Box>
                                )}
                            </Box>
                            </Grid>

                            {/* Additional Info */}
                            <Grid xs={12}>
                            <Typography variant="h6" gutterBottom>
                                {t('additionalInfo')}
                            </Typography>
                            
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                        
                                {vendorId.createdBy && (
                                <Grid xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                    {t('createdBy')}
                                    </Typography>
                                    <Typography variant="body2">
                                    {vendorId.createdBy?.firstName || t('unknown')}
                                    </Typography>
                                </Grid>
                                )}

                                {vendorId.updatedBy && (
                                <Grid xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                    {t('updatedBy')}
                                    </Typography>
                                    <Typography variant="body2">
                                    {vendorId.updatedBy?.firstName || t('unknown')}
                                    </Typography>
                                </Grid>
                                )}
                            </Grid>
                            </Grid>
                        </Grid>
                        ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('noVendorsFound')}
                            </Typography>
                        </Box>
                        )}
                    </Paper>
                    )}
                </>
                )}
            </Box>
        </Dashboard>
    );
};

export default memo(withAuth(Product));