// This as a client side rendering component, it's used if we need to render data from the client side "CSR" so we return renaming this file as page.js
'use client';
import { useEffect, useState, useCallback, memo } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "../../../../contexts/translationContext"; // Import useTranslation
import Dashboard from '@/components/dashboard';
import dayjs from 'dayjs';
import { Typography, Box, TextField, 
    Button, 
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    InputAdornment,
    MenuItem,
    IconButton
 } from '@mui/material';
import { enUS, arSA } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility'
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Breadcrumb from "@/components/UI/breadcrumb"; 
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import { getCustomers, clearCustomers } from '@/store/slices/userSlice';
import Link from 'next/link';
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";

const CustomersListPage = () => {
    const router = useRouter();
    const { t, language } = useTranslation();
    const pathname = usePathname();
    const dispatch = useDispatch();
    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.users?.loading || false);
    const error = useSelector(state => state.users?.error || null);
    const list = useSelector(state => state.users?.list || [], shallowEqual);
    const pagination = useSelector(state => state.users?.pagination || {}, shallowEqual);    
    // Add local states for filtering and pagination
    const [filtersObj, setFilters] = useState({
        search: '',
        active: '',
        startDate: null,
        endDate: null,
        page: 1,
        limit: 3
        // Add more filters as needed
    });
    const [hasSearched, setHasSearched] = useState(false);

    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["view_dashboard", "view_users"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        
        if (!hasAccess) {
        router.push("/home");
        }
    }, [actions, actionsLoaded, router]);
   
    useEffect(() => {
        // When pagination changes in Redux, update local filters
        if (pagination?.page || pagination?.limit) {
            setFilters((prev) => ({
                ...prev,
                page: pagination.page,
                limit: pagination.limit,
            }));
        }
    }, [pagination]);

    // Add cleanup effect when component unmounts
    // This ensures we clear the customers when leaving the page
    // This is useful to reset the state when navigating away
    // and prevents stale data when returning to the page
    useEffect(() => {
        return () => {
        dispatch(clearCustomers()); 
        };
    }, [dispatch]);

    // 🔹 Handle filter changes
    const handleFilterChange = ({ target }) => {
        const { name, value } = target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    
    // Memoize formatted date function
    // Formats date to YYYY-MM-DD or returns null if date is false
    // useCallback to prevent unnecessary re-renders
    const formatDate = useCallback((date) => {
        return date ? dayjs(date).format("YYYY-MM-DD") : null;
    }, []);

    // 🔹 Fetch users from API
    const fetchUsers = async () => {
        try {
            // Format filters before dispatching
            const formattedFilters = {
                ...filtersObj,
                startDate: filtersObj.startDate ? formatDate(filtersObj.startDate) : null,
                endDate: filtersObj.endDate ? formatDate(filtersObj.endDate) : null,
            };

            // Dispatch with formatted date values
            await dispatch(getCustomers(formattedFilters)).unwrap();
            toast.success(t("dataRetreivedSuccessfully"));
        } catch (error) {
            // DO NOT show toast here. Axios interceptor already did it.
        }
    };
    // Handle form submit
    const handleSubmit = async (event) => {
        event.preventDefault();
        const updatedFilters = {
            ...filtersObj,
            page: 1 // Reset to first page on new search
        };
        setFilters(updatedFilters);
        setHasSearched(true); // Set flag when search is performed
        await fetchUsers();
    };

    // 🔹 Reset filters
    const handleResetFilters = () => {
        const resetFilters = {
            search: '',
            active: '',
            startDate: null,
            endDate: null,
            page: 1,
            limit: filtersObj.limit || 3
        };
        setFilters(resetFilters);
        setHasSearched(true); // Set flag when search is performed
    };

    const handleChangePage = async (event, newPage) => {
        const updatedFilters = {
            ...filtersObj,
            page: newPage + 1,
        };
        setFilters(updatedFilters);
        // Wait for state update and then fetch
        await dispatch(getCustomers(updatedFilters)).unwrap();
    };

    const handleChangeRowsPerPage = async (event) => {
        const newLimit = parseInt(event.target.value, 10); // Use base 10
        const updatedFilters = {
            ...filtersObj,
            page: 1,
            limit: newLimit,
        };
        setFilters(updatedFilters);
        await dispatch(getCustomers(updatedFilters)).unwrap();
    };
    return (
        <Dashboard>
            <Box sx={{ mt: 4, display: 'flex', gap: 2,
                    flexDirection: "column" 
             }}>
                {/* Breadcrumb */}
                <Breadcrumb 
                    sideNavItem={t("customers")} 
                    href={"list"} 
                    urlText={t("customersList")}
                    ariaLabel="/dashboard/customers/list" 
                />
                <Typography variant="h4" gutterBottom>
                    {t('customersManagement')}
                </Typography>

                {/* Filters Section */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <form onSubmit={ handleSubmit }>
                        <Box sx={{ display: 'flex', gap: 2, 
                            alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                                name="search"
                                value={filtersObj.search}
                                onChange={handleFilterChange}
                                placeholder={t('search')}
                                size="small"
                                sx={{ minWidth: 200 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                select
                                name="active"
                                value={filtersObj.active}
                                onChange={handleFilterChange}
                                label={t('status')}
                                size="small"
                                sx={{ minWidth: 120 }}
                            >
                                <MenuItem value="">{t('all')}</MenuItem>
                                <MenuItem value="true">{t('active')}</MenuItem>
                                <MenuItem value="false">{t('inactive')}</MenuItem>
                            </TextField>
                            <LocalizationProvider 
                                dateAdapter={AdapterDateFns}
                                // Add these props for RTL support
                                    adapterLocale={language === 'ar' ? arSA : enUS}
                                    sx={{ 
                                        display: 'flex',
                                        flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                                        // gap: 2
                                    }}>
                                <DatePicker
                                    label={t('startDate')}
                                    name="startDate"
                                    value={filtersObj.startDate}
                                    onChange={(newValue) =>
                                    handleFilterChange({ target: { name: 'startDate', value: newValue } })
                                    }
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            dir: language === 'ar' ? 'rtl' : 'ltr',
                                            placeholder: t('startDate'), // Add placeholder translation
                                            inputProps: {
                                                'aria-label': t('startDate')
                                            },
                                            sx: { 
                                                '& .MuiInputBase-root': {
                                                    flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                                                    width: '100%' // Ensure full width

                                                },
                                                '& .MuiInputBase-input': {
                                                    textAlign: language === 'ar' ? 'right' : 'left',
                                                    width: '100%', // Full width for input
                                                    paddingRight: language === 'ar' ? '14px !important' : 'inherit',
                                                    paddingLeft: language === 'ar' ? 'inherit' : '14px !important'
                                                },
                                                '& .MuiInputLabel-root': {
                                                    transformOrigin: language === 'ar' ? 'right' : 'left',
                                                    right: language === 'ar' ? '20px!important' : 'unset',
                                                    left: language === 'ar' ? 'unset' : '14px',
                                                    inset: 'unset'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    textAlign: language === 'ar' ? 'right' : 'left'
                                                },
                                                // Ensure icon stays within bounds
                                                '& .MuiInputAdornment-root': {
                                                    position: 'absolute',
                                                    right: language === 'ar' ? 'unset' : '8px',
                                                    left: language === 'ar' ? '8px' : 'unset'
                                                }
                                            }
                                        },
                                        popper: {
                                            sx: {
                                                direction: language === 'ar' ? 'rtl' : 'ltr'
                                            }
                                        }
                                    }}
                                />
                                <DatePicker
                                    label={t('endDate')}
                                    name="endDate"
                                    value={filtersObj.endDate}
                                    onChange={(newValue) =>
                                    handleFilterChange({ target: { name: 'endDate', value: newValue } })
                                    }
                                    slotProps={{
                                        textField: {
                                        size: 'small',
                                        dir: language === 'ar' ? 'rtl' : 'ltr',
                                        placeholder: t('endDate'), // Add placeholder translation
                                        inputProps: {
                                            'aria-label': t('endDate')
                                        },
                                        sx: { 
                                                '& .MuiInputBase-root': {
                                                    flexDirection: language === 'ar' ? 'row-reverse' : 'row',
                                                    width: '100%' // Ensure full width

                                                },
                                                '& .MuiInputBase-input': {
                                                    textAlign: language === 'ar' ? 'right' : 'left',
                                                    width: '100%', // Full width for input
                                                    paddingRight: language === 'ar' ? '14px !important' : 'inherit',
                                                    paddingLeft: language === 'ar' ? 'inherit' : '14px !important'
                                                },
                                                '& .MuiInputLabel-root': {
                                                    transformOrigin: language === 'ar' ? 'right' : 'left',
                                                    right: language === 'ar' ? '20px!important' : 'unset',
                                                    left: language === 'ar' ? 'unset' : '14px',
                                                    inset: 'unset'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    textAlign: language === 'ar' ? 'right' : 'left'
                                                },
                                                // Ensure icon stays within bounds
                                                '& .MuiInputAdornment-root': {
                                                    position: 'absolute',
                                                    right: language === 'ar' ? 'unset' : '8px',
                                                    left: language === 'ar' ? '8px' : 'unset'
                                                }
                                            }
                                    },
                                    popper: {
                                        sx: {
                                            direction: language === 'ar' ? 'rtl' : 'ltr'
                                        }
                                    }
                                    }}
                                />
                                </LocalizationProvider>
                             {/* Submit & Reset */}
                            <Button type="submit" variant="contained" color="primary" size="small">
                                {t('submit')}
                            </Button>
                            <Button onClick={handleResetFilters} variant="outlined" size="small">
                                {t('reset')}
                            </Button>
                        </Box>
                    </form>
                </Paper>
                {/* Table Section */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('firstName')}</TableCell>
                                <TableCell>{t('lastName')}</TableCell>
                                <TableCell>{t('email')}</TableCell>
                                <TableCell>{t('phoneNumber')}</TableCell>
                                <TableCell>{t('status')}</TableCell>
                                <TableCell>{t('createdAt')}</TableCell>
                                <TableCell>{t('actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Loading />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Error message={error} />
                                </TableCell>
                            </TableRow>
                        ) : !list || list.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    {/* We can add a flag in our state to track if a search has been performed */}
                                    {!hasSearched ? (
                                        <Typography>{t('pleaseSubmitToSearch')}</Typography>
                                    ) : (
                                        <Typography>{t('noCustomersFound')}</Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                                list.map((customer) => (
                                <TableRow key={customer._id}>
                                    <TableCell>{customer.firstName}</TableCell>
                                    <TableCell>{customer.lastName}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>{customer.phoneNumber}</TableCell>
                                    <TableCell>{customer.active ? t('active') : t('inactive')}</TableCell>
                                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                    <Link 
                                        href={`/dashboard/customers/${customer._id}`}
                                        passHref
                                    >
                                        <IconButton
                                            size="small"
                                            aria-label={`${t('viewDetailsFor')} ${customer.name?.[language] || customer.name?.en || ''}`}
                                            color="primary"
                                            title={t('viewDetails')}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Link>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={pagination?.total || 0}
                        page={(filtersObj?.page || 1) - 1}  // convert 1-based to 0-based for MUI
                        onPageChange={handleChangePage}
                        rowsPerPage={filtersObj?.limit || 3}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[3, 5, 10, 25]}
                    />
                </TableContainer>
            </Box>
        </Dashboard>
    );
}

export default memo(withAuth(CustomersListPage));