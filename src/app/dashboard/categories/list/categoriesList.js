'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Image from "next/image";
import Dashboard from '@/components/dashboard';
import Breadcrumb from "@/components/UI/breadcrumb";
import { Box, Typography, Tooltip, Card, CardActionArea, CardContent, Button, 
    TextField, IconButton, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { initializeCategories, deleteCategory } from '@/store/slices/categorySlice';
import { useSearchParams } from 'next/navigation';
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import withAuth from "@/components/withAuth";
import { toast } from "react-toastify";
import { useDebouncedCallback } from 'use-debounce'; 
import dynamic from 'next/dynamic';
const CategoryModal = dynamic(() => import('./categoryModal'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});
const DeleteConfirmDialog = dynamic(() => import('@/components/deleteConfirmDialog'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Safe if modal uses window/document
});

// CategoryList
const CategoriesList  = ({initialData, initialFilters}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    // Local state for search (debounced)
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const loading = useSelector(state => state.categories?.loading || false);
    const error = useSelector(state => state.categories?.error || null);
    const categoriesList = useSelector(state => state.categories?.categoriesList || [], shallowEqual);
    
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
    if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

    const requiredPermissions = ["view_dashboard","delete_category"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
        router.push("/home");
    }
    }, [actions, actionsLoaded , router]);

    // Initialize Redux with server-side data
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            dispatch(initializeCategories(initialData));
        }
    }, [dispatch, initialData]);

    // Get current filter values from URL
    const searchTerm = searchParams.get('search') || '';

    // Update search input when URL changes
    useEffect(() => {
        setSearchInput(searchTerm);
    }, [searchTerm]);

    // Helper function to build URL with filters
    // useCallback to prevent unnecessary re-renders
    const buildURL = useCallback((filters) => {
        const query = new URLSearchParams(); 
        if (filters.search && filters.search.trim() !== '') {
            query.append('search', filters.search.trim());
        }
        return `/dashboard/categories/list?${query.toString()}`;
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


    // Use server-side filtered data directly (no client-side filtering needed)
    const displayCategories = Array.isArray(categoriesList) ? categoriesList : [];

    // handle edit click
    // useCallback to prevent unnecessary re-renders
    const handleEdit = useCallback((cat) => {
        setSelectedCategory(cat);
        setModalOpen(true);
    }, []);

    // handle add click
    const handleAdd = () => {
        setSelectedCategory(null);
        setModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCategory(null);
    };

    // Handle delete click
    const handleDelete = (cat) => {
        setCategoryToDelete(cat);
        setDeleteDialogOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        try {
            await dispatch(deleteCategory(categoryToDelete._id)).unwrap();
            toast.success(t('categoryDeletedSuccessfully'));
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        } catch (err) {
            toast.error(t('categoryDeleteFailed'));
            toast.error(err.details || err.message);
        }
    };

    // Handle delete dialog close
    const handleDeleteDialogClose = () => {
        if (!loading) {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <Dashboard>
            <CategoryModal
                open={modalOpen}
                handleClose={handleCloseModal}
                category={selectedCategory}
                language={language}
                t={t}
                loading={loading}
            />
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={handleDeleteDialogClose}
                dialogTitle={t('confirmDelete')}
                dialogConfirmMsg={
                    <>
                        {t('deleteConfirmMessage')}{' '}
                        <strong>
                            {categoryToDelete?.name?.[language] ||
                                categoryToDelete?.name?.en ||
                                categoryToDelete?.name?.ar ||
                                t('thisCategory')}
                        </strong>
                        ?
                    </>
                }
                cancelButtonText={t('cancel')}
                onConfirm={handleDeleteConfirm}
                deleteButtonText={t('delete')} 
                loading={loading}
                
            />
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("categories")} 
                    href="/dashboard/categories/list" 
                    urlText={t("categoriesList")}
                    ariaLabel="/dashboard/categories/list"
                />
            </Box> 
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: 3 }}>
                <Typography variant="h4">
                    {t('categoriesManagement')}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAdd}
                    aria-label={t('addCategory')}
                >
                    {t('addCategory')}
                </Button>
            </Box>
            <Box sx={{ mb: 4 }}>
                {/**  Search bar for category by name */}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('searchCategory')}
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
                {displayCategories.length === 0 ? (
                    <Typography sx={{ mx: 3 }} variant="body1">
                        {t('noCategoriesFound')}
                    </Typography>
                ) : (
                    displayCategories.map((cat) => (
                    <Grid xs={12} sm={6} md={4} key={cat.id || cat._id}>
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
                                <CardContent
                                    sx={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 2,
                                        p: 0,
                                    }}
                                >
                                    {cat.image && (
                                        <Box mt={1}>
                                            <Image
                                                src={`/api/images/category/${cat.image}`}
                                                alt={cat.name?.[language] || cat.name?.en || cat.name?.ar || t('category')}
                                                width={120}
                                                height={120}
                                                style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                                                onError={() => console.error(`Failed to load image: ${cat.image}`)}
                                                loading="lazy"
                                                />
                                        </Box>
                                        )}
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: cat.color || 'text.primary',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            textTransform: 'capitalize',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                          {cat.name?.[language] || cat.name?.en || cat.name?.ar || t('category')}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                             {/* Edit icon appears on hover */}
                             <Tooltip title={t('editCategory')}>
                                <IconButton
                                    aria-label={t('editCategory')}
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        bgcolor: 'background.paper',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        pointerEvents: 'auto',
                                        zIndex: 2,
                                        '&:hover': { bgcolor: 'primary.light' },
                                        '.MuiCard-root:hover &': {
                                            opacity: 1,
                                        },
                                    }}
                                    onClick={() => handleEdit(cat)}
                                >
                                <EditIcon />
                                </IconButton>
                            </Tooltip>
                            {/** Delete icon appears on hover */}
                            <Tooltip title={t('deleteCategory')}>
                                <IconButton
                                    aria-label={t('deleteCategory')}
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 10,
                                        bgcolor: 'background.paper',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        pointerEvents: 'auto',
                                        zIndex: 2,
                                        '&:hover': { bgcolor: 'error.main' },
                                        '.MuiCard-root:hover &': {
                                            opacity: 1,
                                        },
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(cat);
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Card>
                    </Grid>
                )))}
            </Grid>
            )} 
        </Dashboard> 
    );
}

export default memo(withAuth(CategoriesList));