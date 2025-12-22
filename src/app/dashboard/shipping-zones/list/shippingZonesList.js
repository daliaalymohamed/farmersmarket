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
    MenuItem,
    Avatar,
    Skeleton,
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { checkPermission } from '@/middlewares/frontend_helpers';
import { bulkToggleZoneStatus, initializeZones, updateZoneInList} from '@/store/slices/shippingZonesSlice';
import { useSearchParams } from 'next/navigation';
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import ButtonLoader from "@/components/UI/buttonLoader";
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";
import { useDebouncedCallback } from 'use-debounce'; 
import dynamic from 'next/dynamic';
import { ContactSupportOutlined } from '@mui/icons-material';
const ZoneModal = dynamic(() => import('../shippingZoneModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});
const ConfirmationDialog = dynamic(() => import('@/components/confirmDialog'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});

const ShippingZonesList = ({initialData, initialFilters}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    // Local state for search (debounced)
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [selectedZones, setSelectedZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
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
    const loading = useSelector(state => state.zones?.loading || false);
    const error = useSelector(state => state.zones?.error || null);
    const zonesList = useSelector(state => state.zones?.zonesList || [], shallowEqual);
    const pagination = useSelector(state => state.zones?.pagination || {}, shallowEqual);

    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_dashboard", "view_shipping_zones", "bulk_toggle_shipping_zone_status"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        
        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData && initialData.zones && initialData?.zones?.length >= 0) {
          dispatch(initializeZones({
            zones: initialData.zones,
            pagination: initialData.pagination,
          }));
        }
      }, [dispatch, initialData]);

    // Get current filter values from URL
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
        
        return `/dashboard/shipping-zones/list?${query.toString()}`;
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
            status: selectedStatus,
            search: searchValue,
            limit: limit,
            page: 1 // Reset to page 1 for new search
        });
        
        router.push(url);
    }, 500);

    // Use server-side filtered data directly (no client-side filtering needed)
    const displayZones = Array.isArray(zonesList) ? zonesList : [];

    // Table selection, menu, activate/deactivate logic
    // Handle zone selection
    const handleSelectZone = (zoneId) => {
        setSelectedZones(prev =>
            prev.includes(zoneId)
                ? prev.filter(id => id !== zoneId)
                : [...prev, zoneId]
        );
    };

    // Handle select all zones in the current page
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = displayZones.map(zone => zone._id); 
            setSelectedZones(newSelected);
        } else {
            setSelectedZones([]);
        }
    };

    // Get the action for bulk toggle based on selected zones
    // Bulk toggle logic
    const getBulkToggleAction = () => {
        if (selectedZones.length === 0) return null;
        const selected = zonesList.filter((p) => selectedZones.includes(p._id));
        const allActive = selected.every((p) => p.active);
        const allInactive = selected.every((p) => !p.active);
        return allActive ? 'deactivate' : allInactive ? 'activate' : 'mixed';
    };

    const handleBulkToggle = async () => {
        if (selectedZones.length === 0) return;

        const action = getBulkToggleAction();
        const newStatus = action === 'activate';

        const performToggle = async () => {
            try {
            const result = await dispatch(
                bulkToggleZoneStatus({
                zoneIds: selectedZones,
                active: newStatus,
                })
            ).unwrap();

            // Update Redux
            result.zones.forEach((zone) => dispatch(updateZoneInList(zone)));

            // Reset selection
            setSelectedZones([]);
            
            // Show success
            toast.success(
                newStatus
                ? t('zonesActivatedSuccessfully')
                : t('zonesDeactivatedSuccessfully')
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
            title: t('mixedZonesStatusWarning'),
            message: t('someZonesHaveMixedStatus'),
            onConfirm: performToggle,
            });
        } else {
            performToggle();
        }
    };

    // handle add click
    const handleAdd = () => {
        setSelectedZone(null);
        setModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedZone(null);
    };


    // Handle pagination change
    const handlePageChange = async (event, newPage) => {
        const url = buildURL({
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
            status: selectedStatus,
            search: searchTerm,
            limit: newLimit,
            page: 1 // Reset to page 1
        });
        
        router.push(url);
    };

    // Handle Status Change
    // Only update the URL, let SSR handle data fetching
    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        const url = buildURL({
            status: newStatus,
            search: searchTerm,
            limit: limit,
            page: 1 // Reset to page 1 for new filter
        });
        
        router.push(url);
    };
    
    // Helper function to get colors for status
    // Returns 'success' for active products and 'error' for inactive ones
    // useCallback to prevent unnecessary re-renders
    const getStatusColor = useCallback((isActive) => {
        return isActive === true ? 'success' : 'error';
    }, []);

    // Helper function to format long lists with "+N more"
    const formatList = (list, maxItems = 3) => {
        if (!Array.isArray(list) || list.length === 0) return '–';

        if (list.length <= maxItems) {
            return list.join(', ');
        }

        const visible = list.slice(0, maxItems).join(', ');
        const remaining = list.length - maxItems;
        return `${visible} +${remaining} more`;
    };

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
            <ZoneModal
                open={modalOpen}
                handleClose={handleCloseModal}
                zone={selectedZone}
                language={language}
                t={t}
                loading={loading}
            />
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("shippingZones")} 
                    href="/dashboard/shipping-zones/list" 
                    urlText={t("shippingZonesList")}
                    aria-label="/dashboard/shipping-zones/list" 
                />
            </Box>
            {/* Header */}
            <Box mb={4}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                        <Typography variant="h4" id="shipping-zones-management-heading">
                            {t('shippingZonesManagement')}
                        </Typography>
                        <Typography variant="body1" color="#666">
                            {t('shippingZonesSubtitle')}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            aria-label={t('addZone')}
                            sx={{ borderRadius: 2, bgcolor: '#1976d2' }}
                            onClick={handleAdd}
                        >
                            {t('addZone')}
                        </Button>
                    </Stack>
                </Box>

                {/* Search and Filters */}
                <Card sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            placeholder={t('searchZonesByNameOrZip')}
                            value={searchInput}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
                                'aria-label': t('searchZonesByNameOrZip')
                            }}
                            label={t('search')}
                            aria-label={t('searchZonesByNameOrZip')}
                            sx={{ borderRadius: 2 }}
                        />
                        <Stack direction="row" spacing={2} minWidth="auto">
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
                                <MenuItem value="inactive">{t('inactive')}</MenuItem>
                            </TextField>
                        </Stack>
                    </Stack>
                </Card>
            </Box>

            {/* Zones Table */}
            <Card sx={{ borderRadius: 2, boxShadow: 1 }} aria-label={t('zonesTable')}>
                <Box p={3} borderBottom={1} borderColor="divider">
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                            <Typography variant="h6" fontWeight="bold" id="table-title">
                                {t('shippingZones')} ({pagination.total || 0})
                            </Typography>
                            {selectedZones.length > 0 && (
                                <Typography variant="body2" color="#666" mt={0.5}>
                                    {selectedZones.length} {t('selectedItems')}
                                </Typography>
                            )}
                        </Box>
                        {selectedZones.length > 0 && (
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
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell padding="checkbox">
                            <Checkbox
                                checked={displayZones.length > 0 && displayZones.every(z => selectedZones.includes(z._id))}
                                indeterminate={selectedZones.length > 0 && selectedZones.length < displayZones.length}
                                onChange={handleSelectAll}
                            />
                            </TableCell>
                            <TableCell>{t('zoneName')}</TableCell>
                            <TableCell>{t('zipCodes')}</TableCell>
                            <TableCell>{t('cityNames')}</TableCell>
                            <TableCell>{t('country')}</TableCell>
                            <TableCell>{t('shippingFee')}</TableCell>
                            <TableCell>{t('taxRate')}</TableCell>
                            <TableCell>{t('status')}</TableCell>
                            <TableCell>{t('actions')}</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center"><Loading /></TableCell></TableRow>
                        ) : error ? (
                            <TableRow><TableCell colSpan={9} align="center"><Error message={error} /></TableCell></TableRow>
                        ) : displayZones.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center"><Typography>{t('noZonesFound')}</Typography></TableCell></TableRow>
                        ) : (
                            displayZones.map((zone) => (
                            <TableRow key={zone._id} hover>
                                <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedZones.includes(zone._id)}
                                    onChange={() => handleSelectZone(zone._id)}
                                />
                                </TableCell>
                                <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                                    <LocalShippingIcon fontSize="small" />
                                    </Avatar>
                                    <span>{zone.name[language] || zone.name.en}</span>
                                </Box>
                                </TableCell>
                                <TableCell>
                                    <Tooltip
                                        title={
                                        <Box component="ul" sx={{ margin: 0, padding: '8px 16px', fontSize: '0.875rem' }}>
                                            {(zone.zipCodes || []).map(code => (
                                            <li key={code}>{code}</li>
                                            ))}
                                        </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <span style={{ cursor: 'help' }}>
                                        {formatList(zone.zipCodes)}
                                        </span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                {zone.cityNames?.map(c => c[language] || c.en).join(', ') || '-'}
                                </TableCell>
                                <TableCell>{zone.country}</TableCell>
                                <TableCell>{t('EGP')} {zone.shippingFee.toFixed(2)}</TableCell>
                                <TableCell>{(zone.taxRate * 100).toFixed(1)}%</TableCell>
                                <TableCell>
                                <Chip
                                    icon={zone.active ? <CheckCircleIcon aria-hidden="true" /> : <CancelIcon aria-hidden="true"/>}
                                    label={zone.active ? t('active') : t('inactive')}
                                    color={getStatusColor(zone.active)}
                                    variant="outlined"
                                    size="small"
                                />
                                </TableCell>
                                <TableCell>
                                <IconButton
                                    component={Link}
                                    href={`/dashboard/shipping-zones/${zone._id}`}
                                    size="small"
                                    aria-label={t('editZone')}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                                </TableCell>
                            </TableRow>
                            ))
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
                    aria-label="Zones table pagination"
                    sx={{ borderTop: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}
                />
            </Card>
        </Dashboard>
    );
};

export default memo(withAuth(ShippingZonesList));