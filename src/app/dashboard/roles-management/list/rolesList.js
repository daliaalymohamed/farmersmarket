'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Dashboard from '@/components/dashboard';
import Breadcrumb from "@/components/UI/breadcrumb";
import { Box, Typography, Card, CardActionArea, CardContent, Button, 
    TextField, IconButton, Skeleton, Menu, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid2';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { fetchRoles } from '@/store/slices/roleSlice';
import { fetchAllActions } from '@/store/slices/actionSlice';
import { useSearchParams } from 'next/navigation';
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import { useDebouncedCallback } from 'use-debounce'; 
import dynamic from 'next/dynamic';

const RoleModal = dynamic(() => import('../roleModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});
const PermissionsModal = dynamic(() => import('./permissionsModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});

// Roles List
const RolesList  = ({ initialFilters}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    // Local state for search (debounced)
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);
    const [modalMode, setModalMode] = useState('permissions'); // 'edit' or 'permissions'

    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.roles?.loading || false);
    const error = useSelector(state => state.roles?.error || null);
    const rolesList = useSelector(state => state.roles?.rolesList || [], shallowEqual);
    const actionsList = useSelector(state => state.actions?.actionsList || [], shallowEqual);

    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
    if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

    const requiredPermissions = ["view_roles"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
        router.push("/home");
    }
    }, [actions, actionsLoaded , router]);
   

    // 🔁 Refetch when search params change
    useEffect(() => {
        const search = searchParams.get('search') || '';
        setSearchInput(search);

        const filters = { search };
        dispatch(fetchRoles(filters)); // Always sync with backend
    }, [dispatch, searchParams]);

    // Rendering actions
    useEffect(() => {
        dispatch(fetchAllActions());
    }, [dispatch]);

    // Helper function to build URL with filters
    // useCallback to prevent unnecessary re-renders
    const buildURL = useCallback((filters) => {
        const query = new URLSearchParams(); 
        if (filters.search && filters.search.trim() !== '') {
            query.append('search', filters.search.trim());
        }
        return `/dashboard/roles-management/list?${query.toString()}`;
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
        });
        
        router.push(url);
    }, 500);

    // Handle edit click
    const handleEdit = useCallback(() => {
        console.log('🔧 Opening edit modal for role:', selectedRole); // Debug
        setModalOpen(true);
        setAnchorEl(null); // Close menu
    }, [selectedRole]);

    // handle add click
    const handleAdd = () => {
        setSelectedRole(null);
        setModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedRole(null);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    // Handle permissions modal
    const handleOpenPermissions = () => {
        setPermissionsModalOpen(true);
        setAnchorEl(null); // Close menu
    };


    return (
        <Dashboard>
            {modalOpen && <RoleModal
                    open={modalOpen}
                    handleClose={handleCloseModal}
                    role={selectedRole}
                    t={t}
                    loading={loading}
                />
            }
            {permissionsModalOpen &&
               <PermissionsModal
                open={permissionsModalOpen}
                handleClose={() => setPermissionsModalOpen(false)}
                role={selectedRole}
                actions={actionsList}
                t={t}
                loading={loading}
                />
            }
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("roles")} 
                    href="/dashboard/roles/list" 
                    urlText={t("rolesList")}
                    ariaLabel="/dashboard/roles/list"
                />
            </Box> 
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: 3 }}>
                <Typography variant="h4">
                    {t('rolesManagement')}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAdd}
                    aria-label={t('addRole')}
                >
                    {t('addRole')}
                </Button>
            </Box>
            <Box sx={{ mb: 4 }}>
                {/**  Search bar for role by name */}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('searchRoles')}
                    value={searchInput}
                    onChange={handleSearchChange}
                />
            </Box>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <Loading />
                </Box>
            ) : error ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <Error message={error} />
                </Box>
            ) : (
            <Grid container spacing={4}>
                {rolesList.length === 0 ? (
                    <Typography sx={{ mx: 3 }} variant="body1">
                        {t('noRolesFound')}
                    </Typography>
                ) : (
                    rolesList.map((role) => (
                    <Grid xs={12} sm={6} md={4} key={role.id || role._id}>
                        <Card
                            variant="outlined"
                            sx={{
                                position: 'relative', // 👈 Needed for absolute positioning
                                borderRadius: 3,
                                boxShadow: 2,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-6px)',
                                  boxShadow: 6,
                                  borderColor: 'primary.main',
                                },
                                minHeight: 160,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: 2,
                              }}
                        >
                            <CardActionArea
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    p: 2,
                                  }}
                            >
                                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: 'text.primary',
                                            fontWeight: 600,
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {role.name}
                                    </Typography>

                                    {/* Show action count */}
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {role.actions?.length || 0} {t('permissions')}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>                           
                            <IconButton
                                aria-label={t('moreActions')}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    setAnchorEl(e.currentTarget);
                                    setSelectedRole(role);
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: 'background.paper',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    '&:hover': { bgcolor: 'primary.light' },
                                    '.MuiCard-root:hover &': { opacity: 1 }
                                }}
                                >
                                <MoreVertIcon />
                            </IconButton>
                        </Card>
                    </Grid>
                )))}
            </Grid>
            )} 
            {/* ✅ Menu outside the Grid - only ONE menu for all cards */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                PaperProps={{ style: { minWidth: 200 } }}
            >
                <MenuItem onClick={handleEdit}>
                    {t('editRole')}
                </MenuItem>

                <MenuItem onClick={handleOpenPermissions}>
                    {t('managePermissions')}
                </MenuItem>
            </Menu>
        </Dashboard> 
    );
}

export default memo(withAuth(RolesList));