'use client';

import { useState, useEffect, memo } from 'react';
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
  Stack
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import InventoryIcon from '@mui/icons-material/Inventory';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { updateProductInList, selectProductById } from '@/store/slices/productSlice';
import ProductModal from './productModal';
import Breadcrumb from "@/components/UI/breadcrumb";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";

const Product = ({ initialData, initialCategories }) => {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
  
    const dispatch = useDispatch();

    // Redux Selectors
    const actions = useSelector(
        (state) => state.auth?.actions || [],
        shallowEqual
    );
    const { loading, error } = useSelector(
        state => ({
            loading: state.products.loading,
            error: state.products.error
        }),
        shallowEqual
    );

    useEffect(() => {
        const requiredPermissions = ["delete_product", "edit_product"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        if (!hasAccess) {
        router.push("/home");
        }
    }, [actions, router]);

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
    const handleEdit = (product) => {
        setModalOpen(true);
        setSelectedProduct(product);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000); // Simulate API call
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedProduct(null);
    };

    // Handle delete click
    const handleDelete = (product) => {
        setSelectedProduct(product);
        setDeleteDialogOpen(true);
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
                vendors={[]}
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
                    onClick={() => router.back()}
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
                                    loading="lazy"
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
                            <Button 
                                variant="contained"
                                color="primary"
                                onClick={() => handleEdit(productData)}
                                disabled={loading || isUpdating}
                                startIcon={(loading || isUpdating) ? <ButtonLoader /> : <EditIcon />}
                            >
                                {(loading || isUpdating) ? t('updating') : t('editProduct')}
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="error"
                                onClick={handleDelete}
                                startIcon={<DeleteIcon />}
                            >
                                {t('deleteProduct')}
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
                            <MoneyIcon color="primary" />
                            <Typography color="text.secondary">
                                {t('price')}: {price}
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
                        <Typography variant="h6" gutterBottom>
                        {t('vendorInformation')}
                        </Typography>
                        <Typography color="text.secondary">
                        {t('vendor')}: {productData.vendorId?.name || t('noVendor')}
                        </Typography>
                        {/* Add more vendor details if available */}
                    </Paper>
                )}
                </>
                )}
            </Box>
        </Dashboard>
    );
};

export default withAuth(Product);