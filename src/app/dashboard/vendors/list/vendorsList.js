'use client';
import { useState, useEffect, memo, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Dashboard from '@/components/dashboard';
import Breadcrumb from "@/components/UI/breadcrumb";
const VendorModal = lazy(() => import('../[id]/vendorModal'));
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { initializeVendors, updateVendorInList, bulkToggleVendorStatus } from '@/store/slices/vendorSlice';
import { useSearchParams } from 'next/navigation';
import ButtonLoader from '@/components/UI/buttonLoader';
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import ConfirmationDialog from '@/components/confirmDialog';
import withAuth from "@/components/withAuth";
import { useDebouncedCallback } from 'use-debounce'; 
import { toast } from "react-toastify";

const VendorsList = ({initialData, initialFilters}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    // Local state for search (debounced)
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
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
    const loading = useSelector(state => state.vendors?.loading || false);
    const error = useSelector(state => state.vendors?.error || null);
    const vendorsList = useSelector(state => state.vendors?.vendorsList || [], shallowEqual);
    const pagination = useSelector(state => state.vendors?.pagination || {}, shallowEqual);
   
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_dashboard", "view_vendors", "bulk_toggle_vendor_status"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData?.vendors?.length >= 0) {
            dispatch(initializeVendors({
            vendors: initialData.vendors,
            pagination: initialData.pagination,
            }));
        }
    }, [dispatch, initialData]);

    
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
        
        return `/dashboard/vendors/list?${query.toString()}`;
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
    const displayVendors = Array.isArray(vendorsList) ? vendorsList : [];

    // Table selection, menu, activate/deactivate logic
    // Handle vendor selection
    const handleSelectVendor = (vendorId) => {
        setSelectedVendors(prev =>
            prev.includes(vendorId)
                ? prev.filter(id => id !== vendorId)
                : [...prev, vendorId]
        );
    };

    // Handle select all vendors in the current page
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = displayVendors.map(vendor => vendor._id); 
            setSelectedVendors(newSelected);
        } else {
            setSelectedVendors([]);
        }
    };

    // Get the action for bulk toggle based on selected vendors
    // Bulk toggle logic
    const getBulkToggleAction = () => {
        if (selectedVendors.length === 0) return null;
        const selected = vendorsList.filter((v) => selectedVendors.includes(v._id));
        const allActive = selected.every((v) => v.active);
        const allInactive = selected.every((v) => !v.active);
        return allActive ? 'deactivate' : allInactive ? 'activate' : 'mixed';
    };

    const handleBulkToggle = async () => {
        if (selectedVendors.length === 0) return;

        const action = getBulkToggleAction();
        const newStatus = action === 'activate';

        const performToggle = async () => {
            try {
            const result = await dispatch(
                bulkToggleVendorStatus({
                vendorIds: selectedVendors,
                active: newStatus,
                })
            ).unwrap();

            // Update Redux
            result.vendors.forEach((vendor) => dispatch(updateVendorInList(vendor)));

            // Reset selection
            setSelectedVendors([]);
            
            // Show success
            toast.success(
                newStatus
                ? t('vendorsActivatedSuccessfully')
                : t('vendorsDeactivatedSuccessfully')
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
            message: t('someVendorsHaveMixedStatus'),
            onConfirm: performToggle,
            });
        } else {
            performToggle();
        }
    };

    // handle add click
    const handleAdd = () => {
        setSelectedVendor(null);
        setModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedVendor(null);
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
    // Returns 'success' for active vendors and 'error' for inactive ones
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
            {/* Suspense with loading fallback */}
            <Suspense fallback={null}>
                <VendorModal
                    open={modalOpen}
                    handleClose={handleCloseModal}
                    vendor={selectedVendor}
                    language={language}
                    t={t}
                    loading={loading}
                />
            </Suspense>
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("vendors")} 
                    href="/dashboard/vendors/list" 
                    urlText={t("vendorsList")}
                    aria-label="/dashboard/vendors/list" 
                />
            </Box>
            {/* Header */}
            <Box mb={4}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                        <Typography variant="h4" id="vendors-management-heading">
                            {t('vendorsManagement')}
                        </Typography>
                        <Typography variant="body1" color="#666">
                            {t('vendorsSubtitle')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            aria-label={t('addVendor')}
                            sx={{ borderRadius: 2, bgcolor: '#1976d2' }}
                            onClick={handleAdd}
                        >
                            {t('addVendor')}
                        </Button>
                    </Stack>
                </Box>

                {/* Search and Filters */}
                <Card sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            placeholder={t('searchVendor')}
                            value={searchInput}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
                                'aria-label': t('searchVendor')
                            }}
                            label={t('search')}
                            aria-label={t('searchVendor')}
                            sx={{ borderRadius: 2 }}
                        />
                    </Stack>
                </Card>
            </Box>

            {/* Vendors Table */}
            <Card sx={{ borderRadius: 2, boxShadow: 1 }} aria-label={t('vendorsTable')}>
                <Box p={3} borderBottom={1} borderColor="divider">
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="h6" fontWeight="bold" id="table-title">
                                {t('vendors')} ({pagination.total || 0})
                            </Typography>
                            {selectedVendors.length > 0 && (
                                <Typography variant="body2" color="#666" mt={0.5}>
                                    {selectedVendors.length} {t('selectedItems')}
                                </Typography>
                            )}
                        </Box>
                        {selectedVendors.length > 0 && (
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
                                            displayVendors.length > 0 &&
                                            displayVendors.every(p => selectedVendors.includes(p.id))
                                        }
                                        indeterminate={
                                            selectedVendors.length > 0 &&
                                            selectedVendors.length < displayVendors.length
                                        }                                        
                                        onChange={handleSelectAll}
                                        inputProps={{ 'aria-label': t('selectAllProducts') }}
                                    />
                                </TableCell>
                                <TableCell scope="col">{t('vendorName')}</TableCell>
                                <TableCell scope="col">{t('contactPhone')}</TableCell>
                                <TableCell scope="col">{t('location')}</TableCell>
                                <TableCell scope="col">{t('aboutVendor')}</TableCell>
                                <TableCell scope="col">{t('status')}</TableCell>
                                <TableCell scope="col">{t('socialLinks')}</TableCell>
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
                                ) : !displayVendors || displayVendors.length === 0 ? 
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography>{t('noVendorsFound')}</Typography>
                                    </TableCell>
                                </TableRow>
                                :
                                (
                                    displayVendors.map((vendor) => {
                                        const isSelected = selectedVendors.includes(vendor?._id);
                                        return (
                                            <TableRow
                                                key={vendor?._id}
                                                hover
                                                selected={isSelected}
                                                tabIndex={0}
                                                role="row"
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelectVendor(vendor?._id)}
                                                        inputProps={{ 'aria-label': `Select ${vendor?.name}` }}
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
                                                            <AirportShuttleIcon aria-hidden="true" />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {vendor?.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="#666">
                                                                {t('vendorAddedAtDate')} {new Date(vendor?.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {vendor?.contactPhone || t('noContactPhone')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {vendor?.location || t('noLocation')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Typography variant="body2">
                                                        {vendor?.about || t('noData')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Chip
                                                        label={vendor.active ? t('active') : t('inactive')}
                                                        color={getStatusColor(vendor.active)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell role="cell">
                                                    {vendor?.socialLinks ? (
                                                        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                                                        {/* Facebook */}
                                                        {vendor.socialLinks.facebook ? (
                                                            <Link
                                                                href={vendor.socialLinks.facebook}
                                                                target="_blank"
                                                                rel="noopener"
                                                                aria-label={`${t('openFacebookPageFor')} ${vendor.name}`}
                                                                style={{ textDecoration: 'none' }}
                                                            >
                                                            <Chip
                                                                icon={<Facebook fontSize="small" />}
                                                                label={trimUrl(vendor.socialLinks.facebook)}
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
                                                                sx={{ color: 'text.secondary', borderColor: 'divider' }}
                                                            />
                                                        )}

                                                        {/* Instagram */}
                                                        {vendor.socialLinks.instagram ? (
                                                            <Link
                                                                href={vendor.socialLinks.instagram}
                                                                target="_blank"
                                                                rel="noopener"
                                                                aria-label={`${t('openInstagramPageFor')} ${vendor.name}`}
                                                                style={{ textDecoration: 'none' }}
                                                            >
                                                            <Chip
                                                                icon={<Instagram fontSize="small" />}
                                                                label={trimUrl(vendor.socialLinks.instagram)}
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
                                                                sx={{ color: 'text.secondary', borderColor: 'divider' }}
                                                            />
                                                        )}
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {t('noSocialLinks')}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell role="cell">
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Link 
                                                            href={`/dashboard/vendors/${vendor?._id}`}
                                                            passHref
                                                        >
                                                            <IconButton
                                                                size="small"
                                                                aria-label={`${t('viewDetailsFor')} ${vendor?.name || ''}`}
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
                    aria-label="Vendors table pagination"
                    sx={{ borderTop: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}
                />
            </Card>
        </Dashboard>
    );
};

export default memo(withAuth(VendorsList));