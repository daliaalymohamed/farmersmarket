'use client';
import { useState, useEffect, memo, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Dashboard from '@/components/dashboard';
import Breadcrumb from "@/components/UI/breadcrumb";
const ProductModal = lazy(() => import('../[id]/productModal'));
import Link from 'next/link';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    IconButton,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Checkbox,
    MenuItem,
    Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UploadIcon from '@mui/icons-material/Upload'
import DownloadIcon from '@mui/icons-material/Download'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { checkPermission } from '@/middlewares/frontend_helpers';
import { bulkToggleProductStatus, initializeProducts, updateProductInList } from '@/store/slices/productSlice';
import { initializeCategories } from '@/store/slices/categorySlice';
import { initializeVendors } from '@/store/slices/vendorSlice';
import { useSearchParams } from 'next/navigation';
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import ConfirmationDialog from '@/components/confirmDialog';

import ButtonLoader from "@/components/UI/buttonLoader";
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";
import { useDebouncedCallback } from 'use-debounce'; 

const ProductsList = ({initialData, initialFilters, initialCategories, initialVendors}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    // Local state for search (debounced)
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
            open: false,
            title: '',
            message: '',
            onConfirm: () => {},
    });
    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.products?.loading || false);
    const error = useSelector(state => state.products?.error || null);
    const productsList = useSelector(state => state.products?.productsList || [], shallowEqual);
    const pagination = useSelector(state => state.products?.pagination || {}, shallowEqual);
    const stats = useSelector(state => state.products?.stats || {}, shallowEqual);
    const categoriesList = useSelector(state => state.categories?.categoriesList || [], shallowEqual);

    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_dashboard","bulk_toggle_vendor_status"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        
        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData?.products?.length >= 0) {
          dispatch(initializeProducts({
            products: initialData.products,
            pagination: initialData.pagination,
            stats: initialData.stats
          }));
        }
      }, [dispatch, initialData]);
    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialCategories && initialCategories.length >= 0) {
            dispatch(initializeCategories(initialCategories));
        }
    }, [dispatch, initialCategories]);
    // Initialize Redux with server-side vendors
     useEffect(() => {
        if (initialVendors?.vendors?.length >= 0) {
            dispatch(initializeVendors({
                vendors: initialVendors.vendors
            }));
        }
    }, [dispatch, initialVendors]);

    // Get current filter values from URL
    const selectedCategory = searchParams.get('category') || 'all';
    const selectedStatus = searchParams.get('status') || 'all';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 3;
    const searchTerm = searchParams.get('search') || '';

    // Update search input when URL changes
    useEffect(() => {
        setSearchInput(searchTerm);
    }, [searchTerm]);

    // Helper function to build URL with filters
    const buildURL = useCallback((filters) => {
        const query = new URLSearchParams();
        
        if (filters.category && filters.category !== 'all') {
            query.append('category', filters.category);
        }
        if (filters.status && filters.status !== 'all') {
            query.append('status', filters.status);
        }
        if (filters.search && filters.search.trim() !== '') {
            query.append('search', filters.search.trim());
        }
        if (filters.limit && filters.limit !== 3) {
            query.append('limit', filters.limit.toString());
        }
        if (filters.page && filters.page !== 1) {
            query.append('page', filters.page.toString());
        }
        
        return `/dashboard/products/list?${query.toString()}`;
    }, []);

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        
        // Use debounced search that triggers navigation
        debouncedSearch(value);
    };

    // Debounced search handler to avoid excessive requests, 
    // improving performance and user experience
    const debouncedSearch = useDebouncedCallback((searchValue) => {        
        const url = buildURL({
            category: selectedCategory,
            status: selectedStatus,
            search: searchValue,
            limit: limit,
            page: 1 // Reset to page 1 for new search
        });
        
        router.push(url);
    }, 500);

    // Prepare categories for dropdown
    const categoriesWithAll = [
        { _id: 'all', name: { en: 'All Categories', ar: 'كل الفئات' } },
        ...categoriesList
    ];

    // Use server-side filtered data directly (no client-side filtering needed)
    const displayProducts = Array.isArray(productsList) ? productsList : [];

    // Table selection, menu, activate/deactivate logic
    // Handle product selection
    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Handle select all products in the current page
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = displayProducts.map(product => product._id); 
            setSelectedProducts(newSelected);
        } else {
            setSelectedProducts([]);
        }
    };

    // Get the action for bulk toggle based on selected products
    // Bulk toggle logic
    const getBulkToggleAction = () => {
        if (selectedProducts.length === 0) return null;
        const selected = productsList.filter((p) => selectedProducts.includes(p._id));
        const allActive = selected.every((p) => p.isActive);
        const allInactive = selected.every((p) => !p.isActive);
        return allActive ? 'deactivate' : allInactive ? 'activate' : 'mixed';
    };

    const handleBulkToggle = async () => {
        if (selectedProducts.length === 0) return;

        const action = getBulkToggleAction();
        const newStatus = action === 'activate';

        const performToggle = async () => {
            try {
            const result = await dispatch(
                bulkToggleProductStatus({
                productIds: selectedProducts,
                isActive: newStatus,
                })
            ).unwrap();

            // Update Redux
            result.products.forEach((product) => dispatch(updateProductInList(product)));

            // Reset selection
            setSelectedProducts([]);
            
            // Show success
            toast.success(
                newStatus
                ? t('productsActivatedSuccessfully')
                : t('productsDeactivatedSuccessfully')
            )
            // Optionally show message from server
            // toast.success(result.message);
            } catch (error) {
            toast.error(t('bulkToggleFailed'));
            }
        };

        if (action === 'mixed') {
            // Show reusable dialog
            setConfirmDialog({
            open: true,
            title: t('mixedStatusWarning'),
            message: t('someProductsHaveMixedStatus'),
            onConfirm: performToggle,
            });
        } else {
            performToggle();
        }
    };

    // handle add click
    const handleAdd = () => {
        setSelectedProduct(null);
        setModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedProduct(null);
    };


    // Handle pagination change
    const handlePageChange = async (event, newPage) => {
        const url = buildURL({
            category: selectedCategory,
            status: selectedStatus,
            search: searchTerm,
            limit: limit,
            page: newPage + 1 // Convert from 0-based to 1-based
        });
        
        router.push(url);
    };

    // Handle rows per page change
    const handleRowsPerPageChange = (event) => {
        const newLimit = parseInt(event.target.value, 10);
        const url = buildURL({
            category: selectedCategory,
            status: selectedStatus,
            search: searchTerm,
            limit: newLimit,
            page: 1 // Reset to page 1
        });
        
        router.push(url);
    };

    // Handle Category Change
    // Only update the URL, let SSR handle data fetching
    const handleCategoryChange = async (e) => {
        const newCategory = e.target.value;
        const url = buildURL({
            category: newCategory,
            status: selectedStatus,
            search: searchTerm,
            limit: limit,
            page: 1 // Reset to page 1 for new filter
        });
        
        router.push(url);
    };

    // Handle Status Change
    // Only update the URL, let SSR handle data fetching
    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        const url = buildURL({
            category: selectedCategory,
            status: newStatus,
            search: searchTerm,
            limit: limit,
            page: 1 // Reset to page 1 for new filter
        });
        
        router.push(url);
    };
    

    // Helper function for stock status and colors
    const getStockStatus = (stock) => {
        if (stock === 0) return { color: 'error', label: t('outOfStock'), icon: <CancelIcon aria-hidden="true" /> };
        if (stock < 10) return { color: 'warning', label: t('lowStock'), icon: <WarningIcon aria-hidden="true" /> };
        return { color: 'success', label: t('inStock'), icon: <CheckCircleIcon aria-hidden="true" /> };
    };

    // Helper function to get colors for status
    // Returns 'success' for active products and 'error' for inactive ones
    // useCallback to prevent unnecessary re-renders
    const getStatusColor = useCallback((isActive) => {
        return isActive === true ? 'success' : 'error';
    }, []);

    // Helper function for featured
    // Returns 'success' for featured products and 'error' for non-featured ones
    // useCallback to prevent unnecessary re-renders
    const getFeaturedColor = useCallback((isFeatured) => {
        return isFeatured === true ? 'success': 'error'
    }, []);
    
    // Helper function for on sale
    // Returns 'success' for on-sale products and 'error' for non-on-sale ones
    // useCallback to prevent unnecessary re-renders
    const getIsOnSaleColor = useCallback((isOnSale) => {
        return isOnSale === true ? 'success': 'error'
    }, []);

    return (
        <Dashboard>
            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                confirmButtonText={t('confirm')}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                confirmColor="error"
                cancelColor="inherit"
                cancelButtonText={t('cancel')}
            />
            {/* Suspense with loading fallback */}
            <Suspense fallback={null}>
                <ProductModal
                    open={modalOpen}
                    handleClose={handleCloseModal}
                    product={selectedProduct}
                    language={language}
                    t={t}
                    loading={loading}
                    categories={initialCategories}
                    vendors={initialVendors.vendors || []}
                />
            </Suspense>
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("products")} 
                    href="/dashboard/products/list" 
                    urlText={t("productsList")}
                    aria-label="/dashboard/products/list" 
                />
            </Box>
            {/* Header */}
            <Box mb={4}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                        <Typography variant="h4" id="products-management-heading">
                            {t('productsManagement')}
                        </Typography>
                        <Typography variant="body1" color="#666">
                            {t('productsSubtitle')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            aria-label="Import products"
                            title="Import products"
                        >
                            {t('importProducts')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            aria-label="Export products"
                            title="Export products"
                        >
                            {t('exportProducts')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            aria-label={t('addProduct')}
                            sx={{ borderRadius: 2, bgcolor: '#1976d2' }}
                            onClick={handleAdd}
                        >
                            {t('addProduct')}
                        </Button>
                    </Stack>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} mb={3} aria-label={t('productStatisticsOverview')}>
                    {[
                        { title: t('totalProducts'), value: stats.total, icon: <LocalShippingIcon aria-hidden="true" />, color: '#1976d2', bg: '#e3f2fd' },
                        { title: t('active'), value: stats.active, icon: <CheckCircleIcon aria-hidden="true" />, color: '#4caf50', bg: '#e8f5e8' },
                        { title: t('lowStock'), value: stats.lowStock, icon: <WarningIcon aria-hidden="true" />, color: '#ff9800', bg: '#fff3e0' },
                        { title: t('inActive'), value: stats.inactive, icon: <CancelIcon aria-hidden="true" />, color: '#f44336', bg: '#ffebee' },
                        { title: t('totalValue'), value: `$${stats.totalValue.toLocaleString()}`, icon: <ShoppingCartIcon aria-hidden="true" />, color: '#9c27b0', bg: '#f3e5f5' }
                    ].map((card, index) => (
                        <Grid xs={12} sm={6} md={2.4} key={index}>
                            <Card sx={{ borderRadius: 2, boxShadow: 1 }} aria-labelledby={`stat-title-${index}`}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="body2" color="#666" id={`stat-title-${index}`}>
                                                {card.title}
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" color={card.color}>
                                                {card.value}
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{ bgcolor: card.bg, color: card.color }}>
                                            {card.icon}
                                        </Avatar>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Search and Filters */}
                <Card sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            placeholder={t('searchProduct')}
                            value={searchInput}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
                                'aria-label': t('searchProduct')
                            }}
                            label={t('search')}
                            aria-label={t('searchProduct')}
                            sx={{ borderRadius: 2 }}
                        />
                        <Stack direction="row" spacing={2} minWidth="auto">
                            <TextField
                                select
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                label={t('category')}
                                sx={{ minWidth: 150 }}
                                aria-label={t('selectCategoryFilter')}
                            >
                                {categoriesWithAll?.map((category) => (
                                    <MenuItem key={category._id} value={category._id}>
                                        {category.name?.[language] || category.name?.en || category.name?.ar || "Category"}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                value={selectedStatus}
                                onChange={handleStatusChange}
                                label={t('status')}
                                sx={{ minWidth: 120 }}
                                aria-label={t('selectStatusFilter')}
                            >
                                <MenuItem value="all">{t('allStatus')}</MenuItem>
                                <MenuItem value="active">{t('active')}</MenuItem>
                                <MenuItem value="inactive">{t('inActive')}</MenuItem>
                            </TextField>
                            <Button
                                variant="outlined"
                                startIcon={<FilterListIcon />}
                                aria-label={t('applyMoreFilters')}
                                title={t('applyMoreFilters')}
                            >
                                {t('moreFilters')}
                            </Button>
                        </Stack>
                    </Stack>
                </Card>
            </Box>

            {/* Products Table */}
            <Card sx={{ borderRadius: 2, boxShadow: 1 }} aria-label={t('productsTable')}>
                <Box p={3} borderBottom={1} borderColor="divider">
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="h6" fontWeight="bold" id="table-title">
                                {t('products')} ({pagination.total || 0})
                            </Typography>
                            {selectedProducts.length > 0 && (
                                <Typography variant="body2" color="#666" mt={0.5}>
                                    {selectedProducts.length} {t('selectedItems')}
                                </Typography>
                            )}
                        </Box>
                        {selectedProducts.length > 0 && (
                            <Stack direction="row" spacing={1}>
                                <Button 
                                    variant="contained"
                                    color={getBulkToggleAction() === 'activate' ? 'success' : 'error'}
                                    onClick={handleBulkToggle}
                                    disabled={loading}
                                    startIcon={(loading) ? <ButtonLoader /> : null}
                                    aria-label={loading 
                                        ? <ButtonLoader /> 
                                        : getBulkToggleAction() === 'activate' 
                                        ? t('activateSelected') 
                                        : t('deactivateSelected')
                                    }
                                    >
                                    {loading 
                                        ? <ButtonLoader /> 
                                        : getBulkToggleAction() === 'activate' 
                                        ? t('activateSelected') 
                                        : t('deactivateSelected')
                                    }
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Box>
                <TableContainer>
                    <Table
                        aria-labelledby="table-title"
                        aria-describedby="table-description"
                        role="table"
                    >
                        <caption id="table-description">{t('productsCaptions')}</caption>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            displayProducts.length > 0 &&
                                            displayProducts.every(p => selectedProducts.includes(p._id))
                                        }
                                        indeterminate={
                                            selectedProducts.length > 0 &&
                                            selectedProducts.length < displayProducts.length
                                        }                                        
                                        onChange={handleSelectAll}
                                        inputProps={{ 'aria-label': t('selectAllVendors') }}
                                    />
                                </TableCell>
                                <TableCell scope="col">{t('product')}</TableCell>
                                <TableCell scope="col">{t('category')}</TableCell>
                                <TableCell scope="col">{t('vendor')}</TableCell>
                                <TableCell scope="col">{t('price')}</TableCell>
                                <TableCell scope="col">{t('stock')}</TableCell>
                                <TableCell scope="col">{t('status')}</TableCell>
                                <TableCell scope="col">{t('featured')}</TableCell>
                                <TableCell scope="col">{t('onSale')}</TableCell>
                                <TableCell scope="col">{t('actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                             {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <Loading />
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <Error message={error} />
                                        </TableCell>
                                    </TableRow>
                                ) : !displayProducts || displayProducts.length === 0 ? 
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography>{t('noProductsFound')}</Typography>
                                    </TableCell>
                                </TableRow>
                                :
                                (
                                    displayProducts.map((product) => {
                                        const isSelected = selectedProducts.includes(product?._id);
                                        const stockStatus = getStockStatus(product?.stock);
                                        return (
                                            <TableRow
                                                key={product?._id}
                                                hover
                                                selected={isSelected}
                                                tabIndex={0}
                                                role="row"
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelectProduct(product?.id)}
                                                        inputProps={{ 'aria-label': `Select ${product?.name}` }}
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Box display="flex" alignItems="center">
                                                        <Avatar 
                                                            sx={{ 
                                                                width: 48, 
                                                                height: 48, 
                                                                mr: 2, 
                                                                bgcolor: '#f5f5f5',
                                                                color: '#666'
                                                            }}
                                                        >
                                                            <LocalShippingIcon aria-hidden="true" />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {product?.name?.[language] || product?.name?.en || ''}
                                                            </Typography>
                                                            <Typography variant="caption" color="#666">
                                                                {t('productAddedAtDate')} {new Date(product?.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    {
                                                        product?.categoryId ? (
                                                        <Chip
                                                            label={product.categoryId.name?.[language] || product?.categoryId.name?.en || ''}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    ): <Typography variant="body2" color="text.secondary">{t('noCategoriesFound')}</Typography>}
                                                </TableCell>
                                                <TableCell role="cell">
                                                    {
                                                        product?.vendorId ? (
                                                    
                                                        <Chip
                                                            label={product?.vendorId.name || ''}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    ): <Typography variant="body2" color="text.secondary">{t('noVendorsFound')}</Typography>}
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        ${product.price}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Chip
                                                        label={`${product?.stock} units`}
                                                        color={stockStatus.color}
                                                        variant="outlined"
                                                        size="small"
                                                        icon={stockStatus.icon}
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Chip
                                                        label={product.isActive ? t('active') : t('inactive')}
                                                        color={getStatusColor(product?.isActive)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Chip
                                                        label={product?.isFeatured? t('isFeatured') : t('notFeatured')}
                                                        color={getFeaturedColor(product?.isFeatured)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Chip
                                                        label={product?.isOnSale? t('onSale') : t('notOnSale')}
                                                        color={getIsOnSaleColor(product?.isOnSale)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Link 
                                                            href={`/dashboard/products/${product?._id}`}
                                                            passHref
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                aria-label={`${t('viewDetailsFor')} ${product?.name?.[language] || product?.name?.en || ''}`}
                                                                color="primary"
                                                                title={t('viewDetails')}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Link>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={pagination.total || 0}
                    page={page - 1}  // convert 1-based to 0-based for MUI
                    onPageChange={handlePageChange}
                    rowsPerPage={limit}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[3, 5, 10, 25]}
                    aria-label="Products table pagination"
                    sx={{ borderTop: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}
                />
            </Card>

            {/* Context Menu */}
            {/* <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                aria-label="Product context menu"
            >
                <MenuItem onClick={handleMenuClose} aria-label={t('viewDetails')}>
                    <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
                    {t('viewDetails')}
                </MenuItem>
                <MenuItem onClick={handleMenuClose} aria-label={t('editProduct')}>
                    <EditIcon sx={{ mr: 1 }} fontSize="small" />
                    {t('editProduct')}
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} aria-label={t('deleteProduct')} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                    {t('deleteProduct')}
                </MenuItem>
            </Menu> */}

            {/* Delete Dialog */}
            {/* <Dialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
            >
                <DialogTitle id="dialog-title">Delete Product</DialogTitle>
                <DialogContent>
                    <Typography id="dialog-description">
                        Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog> */}

            {/* Floating Action Button */}
            {/* <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 24, right: 24 }}
                aria-label="Add new product"
            >
                <AddIcon />
            </Fab> */}
        </Dashboard>
    );
};

export default memo(withAuth(ProductsList));