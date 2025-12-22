'use client';
import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Dashboard from '@/components/dashboard';
import Breadcrumb from "@/components/UI/breadcrumb";
import Link from 'next/link';
import {
    Box,
    Typography,
    Card,
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
    Avatar,
    Skeleton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { fetchWarehouses, updateWarehouseInList, bulkToggleWarehouseActiveStatus } from '@/store/slices/warehouseSlice';
import { useSearchParams } from 'next/navigation';
import ButtonLoader from '@/components/UI/buttonLoader';
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import { useDebouncedCallback } from 'use-debounce'; 
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';
const WarehouseModal = dynamic(() => import('../warehouseModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});
const ConfirmationDialog = dynamic(() => import('@/components/confirmDialog'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});


const WarehousesList = ({initialData, initialFilters}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    // Local state for search (debounced)
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
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
    const loading = useSelector(state => state.warehouses?.loading || false);
    const error = useSelector(state => state.warehouses?.error || null);
    const warehousesList = useSelector(state => state.warehouses?.warehousesList || [], shallowEqual);
    const pagination = useSelector(state => state.warehouses?.pagination || {}, shallowEqual);
   
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_dashboard", "view_warehouses", "bulk_toggle_warehouse_status"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // 🔁 Refetch when search params change
    useEffect(() => {
        const search = searchParams.get('search') || '';
        setSearchInput(search);

        const filters = { search };
        dispatch(fetchWarehouses(filters)); // Always sync with backend
    }, [dispatch, searchParams]);

    
    // Get current filter values from URL
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
        
        if (filters.search && filters.search.trim() !== '') {
            query.append('search', filters.search.trim());
        }
        if (filters.limit && filters.limit !== 3) {
            query.append('limit', filters.limit.toString());
        }
        if (filters.page && filters.page !== 1) {
            query.append('page', filters.page.toString());
        }
        
        return `/dashboard/warehouses/list?${query.toString()}`;
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
            search: searchValue,
            limit: limit,
            page: 1 // Reset to page 1 for new search
        });
        
        router.push(url);
    }, 500);


    // Use server-side filtered data directly (no client-side filtering needed)
    const displayWarehouses = Array.isArray(warehousesList) ? warehousesList : [];

    // Table selection, menu, activate/deactivate logic
    // Handle warehouse selection
    const handleSelectWarehouse = (warehouseId) => {
        setSelectedWarehouses(prev =>
            prev.includes(warehouseId)
                ? prev.filter(id => id !== warehouseId)
                : [...prev, warehouseId]
        );
    };

    // Handle select all warehouses in the current page
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = displayWarehouses.map(warehouse => warehouse._id); 
            setSelectedWarehouses(newSelected);
        } else {
            setSelectedWarehouses([]);
        }
    };

    // Get the action for bulk toggle based on selected warehouses
    // Bulk toggle logic
    const getBulkToggleAction = () => {
        if (selectedWarehouses.length === 0) return null;
        const selected = warehousesList.filter((v) => selectedWarehouses.includes(v._id));
        const allActive = selected.every((v) => v.active);
        const allInactive = selected.every((v) => !v.active);
        return allActive ? 'deactivate' : allInactive ? 'activate' : 'mixed';
    };

    const handleBulkToggle = async () => {
        if (selectedWarehouses.length === 0) return;

        const action = getBulkToggleAction();
        const newStatus = action === 'activate';

        const performToggle = async () => {
            try {
            const result = await dispatch(
                bulkToggleWarehouseActiveStatus({
                warehouseIds: selectedWarehouses,
                active: newStatus,
            })
            ).unwrap();

            // Update Redux
            result.warehouses.forEach((warehouse) => dispatch(updateWarehouseInList(warehouse)));

            // Reset selection
            setSelectedWarehouses([]);
            
            // Show success
            toast.success(
                newStatus
                ? t('warehousesActivatedSuccessfully')
                : t('warehousesDeactivatedSuccessfully')
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
            message: t('someWarehousesHaveMixedStatus'),
            onConfirm: performToggle,
            });
        } else {
            performToggle();
        }
    };

    // handle add click
    const handleAdd = () => {
        setSelectedWarehouse(null);
        setModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedWarehouse(null);
    };

    // Handle pagination change
    const handlePageChange = async (event, newPage) => {
        const url = buildURL({
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
            search: searchTerm,
            limit: newLimit,
            page: 1 // Reset to page 1
        });
        
        router.push(url);
    }; 

    // Trim URL function to display social links
    // This function trims the URL to a maximum of 10 characters for display purposes
    // If the URL is invalid, it returns a shortened version of the original URL
    // useCallback to prevent unnecessary re-renders
    const trimUrl = useCallback((url) => {
        try {
            const u = new URL(url);
            return u.hostname.replace('www.', '') + u.pathname.replace(/\/$/, '').substring(0, 15);
        } catch {
            return url.length > 20 ? url.slice(0, 20) + '...' : url;
        }
    }, []);

    // Helper function to get colors for status
    // Returns 'success' for active warehouses and 'error' for inactive ones
    // useCallback to prevent unnecessary re-renders
    const getStatusColor = useCallback((isActive) => {
        return isActive === true ? 'success' : 'error';
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
            <WarehouseModal
                open={modalOpen}
                handleClose={handleCloseModal}
                warehouse={selectedWarehouse}
                t={t}
                loading={loading}
            />
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("warehouses")} 
                    href="/dashboard/warehouses/list" 
                    urlText={t("warehousesList")}
                    aria-label="/dashboard/warehouses/list" 
                />
            </Box>
            {/* Header */}
            <Box mb={4}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                        <Typography variant="h4" id="warehouses-management-heading">
                            {t('warehousesManagement')}
                        </Typography>
                        <Typography variant="body1" color="#666">
                            {t('warehousesSubtitle')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            aria-label={t('addWarehouse')}
                            sx={{ borderRadius: 2, bgcolor: '#1976d2' }}
                            onClick={handleAdd}
                        >
                            {t('addWarehouse')}
                        </Button>
                    </Stack>
                </Box>

                {/* Search and Filters */}
                <Card sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            placeholder={t('searchWarehouse')}
                            value={searchInput}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
                                'aria-label': t('searchWarehouse')
                            }}
                            label={t('search')}
                            aria-label={t('searchWarehouse')}
                            sx={{ borderRadius: 2 }}
                        />
                    </Stack>
                </Card>
            </Box>

            {/* Warehouses Table */}
            <Card sx={{ borderRadius: 2, boxShadow: 1 }} aria-label={t('warehousesTable')}>
                <Box p={3} borderBottom={1} borderColor="divider">
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="h6" fontWeight="bold" id="table-title">
                                {t('warehouses')} ({pagination.total || 0})
                            </Typography>
                            {selectedWarehouses.length > 0 && (
                                <Typography variant="body2" color="#666" mt={0.5}>
                                    {selectedWarehouses.length} {t('selectedItems')}
                                </Typography>
                            )}
                        </Box>
                        {selectedWarehouses.length > 0 && (
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
                        aria-describedby="table-about"
                        role="table"
                    >
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            displayWarehouses.length > 0 &&
                                            displayWarehouses.every(p => selectedWarehouses.includes(p.id))
                                        }
                                        indeterminate={
                                            selectedWarehouses.length > 0 &&
                                            selectedWarehouses.length < displayWarehouses.length
                                        }                                        
                                        onChange={handleSelectAll}
                                        inputProps={{ 'aria-label': t('selectAllProducts') }}
                                    />
                                </TableCell>
                                <TableCell scope="col">{t('warehouseName')}</TableCell>
                                <TableCell scope="col">{t('phone')}</TableCell>
                                <TableCell scope="col">{t('email')}</TableCell>
                                <TableCell scope="col">{t('contactPerson')}</TableCell>
                                <TableCell scope="col">{t('status')}</TableCell>
                                <TableCell scope="col">{t('capacity')}</TableCell>
                                <TableCell scope="col">{t('warehouseManager')}</TableCell>
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
                                ) : !displayWarehouses || displayWarehouses.length === 0 ? 
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography>{t('noWarehousesFound')}</Typography>
                                    </TableCell>
                                </TableRow>
                                :
                                (
                                    displayWarehouses.map((warehouse) => {
                                        const isSelected = selectedWarehouses.includes(warehouse?._id);
                                        return (
                                            <TableRow
                                                key={warehouse?._id}
                                                hover
                                                selected={isSelected}
                                                tabIndex={0}
                                                role="row"
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelectWarehouse(warehouse?._id)}
                                                        inputProps={{ 'aria-label': `Select ${warehouse?.name}` }}
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
                                                            <WarehouseIcon fontSize="small" aria-hidden="true" />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {warehouse?.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="#666">
                                                                {t('warehouseAddedAtDate')} {new Date(warehouse?.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {warehouse?.contactInfo?.phone || t('noContactPhone')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {warehouse?.contactInfo?.email || t('noContactEmail')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {warehouse?.contactInfo?.contactPerson || t('noContactPerson')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Chip
                                                        label={warehouse.active ? t('active') : t('inactive')}
                                                        color={getStatusColor(warehouse.active)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {warehouse?.capacity || t('noData')}
                                                    </Typography>
                                                </TableCell>   
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {warehouse?.managerId?.firstName || t('noManagerAssigned')}
                                                    </Typography>
                                                </TableCell> 
                                                <TableCell role="cell">
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Link 
                                                            href={`/dashboard/warehouses/${warehouse?._id}`}
                                                            passHref
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                aria-label={`${t('viewDetailsFor')} ${warehouse?.name || ''}`}
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
                    aria-label={t('warehousesPagination')}
                    sx={{ borderTop: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}
                />
            </Card>
        </Dashboard>
    );
};

export default memo(withAuth(WarehousesList));