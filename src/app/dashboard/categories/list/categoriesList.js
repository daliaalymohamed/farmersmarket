'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Image from "next/image";
import Dashboard from '@/components/dashboard';
import Breadcrumb from "@/components/UI/breadcrumb";
import { Box, Typography, Tooltip, Card, CardActionArea, CardContent, Button, 
    TextField, IconButton, InputLabel, Stack, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { checkPermission } from '@/middlewares/frontend_helpers';
// import Image from 'next/image'; // Uncomment when you want to use images
import { addCategory, editCategory, deleteCategory } from '@/store/slices/categorySlice';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loading from "@/components/UI/loading";
import Error from "@/components/UI/error";
import ButtonLoader from "@/components/UI/buttonLoader";
import withAuth from "@/components/withAuth";
import { categorySchema } from '@/lib/utils/validation';
import suppliesImage from '../../../../assets/supplies.jpeg'; // default image
import { toast } from "react-toastify";

// Delete Confirmation Dialog Component
const DeleteConfirmDialog = ({ open, onClose, onConfirm, categoryName, loading, t }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
            <DialogContent>
                <Typography>
                    {/* {t('deleteConfirmMessage', `${categoryName || 'this category'}`)} */}
                    ${t('deleteConfirmMessage')} {categoryName || 'this category'} 
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {t('cancel')}
                </Button>
                <Button 
                    onClick={onConfirm} 
                    color="error" 
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? <ButtonLoader /> : t('delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Category modal to edit and add new category
const CategoryModal = ({ open, handleClose, category, onSave, t, loading }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    // Local state for image preview
    // This will hold the image URL for previewing before submission
    // If category is provided, use its image; otherwise, default to an empty string
    const [imagePreview, setImagePreview] = useState(category?.image || '');

    // Redux Selectors
    const actions = useSelector(
        (state) => state.auth?.actions || [],
        shallowEqual 
    ); // With shallowEqual - only re-renders if selected values actually changed
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
    const requiredPermissions = ["edit_category", "create_category"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
        router.push("/home");
    }
    }, [actions, router]);



    // Category form hook with edit mode detection
    const isEditMode = !!(category && category._id);
    // Category form hook
      const {
        register,
        handleSubmit: handleSubmitCategory,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
      } = useForm({
        mode: 'onChange',
        resolver: yupResolver(categorySchema(t, isEditMode)),
        defaultValues: {
          name: {
            en: category?.name?.en || '',
            ar: category?.name?.ar || '',
          },
          color: category?.color || '#1976d2',
          image: category?.image || null,
        }
      });

    // Reset form when modal opens/closes or category changes
    useEffect(() => {
        reset({
          name: {
            en: category?.name?.en || '',
            ar: category?.name?.ar || '',
          },
          color: category?.color || '#1976d2',
          image: category?.image || null,
        });
        setImagePreview(category?.image || suppliesImage);
    }, [category, open, reset]);
        
    // Handle image file input and preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setValue('image', file, { shouldValidate: true }); // Set new file
            setImagePreview(URL.createObjectURL(file));
        }
    };  

    // Handle form submission for adding/editing category
    const onSubmitCategory = async (data) => {
        try {
            let payload;
            let updatedCategory;
            
            // Always check if we have a new file (File object)
            const hasNewFile = data.image instanceof File;
            
            if (hasNewFile) {
                // Use FormData when uploading a new file
                // console.log("📁 Sending FormData (new file upload)");
                payload = new FormData();
                payload.append('name.en', data.name.en);
                payload.append('name.ar', data.name.ar);
                payload.append('color', data.color);
                payload.append('image', data.image);
                if (category?._id) payload.append('_id', category._id);
            } else {
                // Use JSON when no new file upload
                // console.log("📄 Sending JSON (no new file)");
                payload = { 
                    name: data.name,
                    color: data.color,
                    // Don't include image field if it's not a new file
                    _id: category?._id 
                };
            }
            
            if (category && category._id) {
                // Edit existing category
                const result = await dispatch(editCategory({
                    categoryId: category._id, 
                    categoryData: payload
                })).unwrap();
                updatedCategory = result.category; // Extract from response
                toast.success(t('categoryupdatedSuccessfully'));
            } else {
                // Add new category - always use FormData for new categories with images
                if (!(payload instanceof FormData)) {
                    const formPayload = new FormData();
                    formPayload.append('name.en', data.name.en);
                    formPayload.append('name.ar', data.name.ar);
                    formPayload.append('color', data.color);
                    if (data.image instanceof File) {
                        formPayload.append('image', data.image);
                    }
                    payload = formPayload;
                }
                
                const result = await dispatch(addCategory(payload)).unwrap();
                updatedCategory = result.category; // Extract from response
                toast.success(t('categoryaddedSuccessfully'));
            }
            
            // ✅ Always pass the real updated category to onSave
            onSave(updatedCategory); // ← Not the form payload, but the response from API
            handleClose();
            
        } catch (err) {
            toast.error(t('categorySaveFailed'));
            toast.error(err.details);
        }
    };
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {category ? t('editCategory') : t('addCategory')}
            </DialogTitle>
            <form onSubmit={handleSubmitCategory(onSubmitCategory)} encType="multipart/form-data">
                <DialogContent>
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2}>
                            <>
                                <TextField
                                    label={t('nameEn')}
                                    {...register('name.en')}
                                    error={!!errors?.name?.en}
                                    helperText={errors?.name?.en?.message}
                                    fullWidth
                                    required
                                />
                                {errors?.name?.en && (
                                    <Typography color="error" variant="caption">
                                    {errors.name.en.message}
                                    </Typography>
                                )}
                                <TextField
                                    label={t('nameAr')}
                                    {...register('name.ar')}
                                    error={!!errors?.name?.ar}
                                    helperText={errors?.name?.ar?.message}
                                    fullWidth
                                    required
                                />
                                {errors?.name?.ar && (
                                    <Typography color="error" variant="caption">
                                    {errors.name.ar.message}
                                    </Typography>
                                )}
                            </>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <InputLabel shrink>{t('textColor')}</InputLabel>
                            <Controller
                                name="color"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        type="color"
                                        {...field}
                                        sx={{ width: 60, p: 0, minWidth: 0, border: 'none' }}
                                        inputProps={{ style: { padding: 0, border: 'none', width: 40, height: 40 } }}
                                        error={!!errors?.color}
                                    />
                                )}
                            />
                            {errors?.color && (
                                <Typography color="error" variant="caption">{errors.color.message}</Typography>
                            )}
                        </Stack>
                        <Stack spacing={1}>
                            <InputLabel shrink>{t('categoryImage')}</InputLabel>
                            <Button variant="outlined" component="label">
                                {t('uploadImage')}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </Button>
                            {imagePreview && (
                                <Box mt={1}>
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        style={{
                                            width: '100%',
                                            maxWidth: '300px',
                                            height: 'auto',
                                            maxHeight: 250,
                                            objectFit: 'contain',
                                            margin: 'auto',
                                            borderRadius: 8,
                                            border: '1px solid #ccc',
                                            padding: 4,
                                          }}
                                    />
                                </Box>
                            )}
                            {errors?.image && (
                                <Typography color="error" variant="caption">{errors.image.message}</Typography>
                            )}
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} variant="outlined">{t('cancel')}</Button>
                    <Button variant="contained" color="primary" type="submit" disabled={loading}>
                        {loading ? <ButtonLoader /> : t('saveChanges')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

const CategoriesList  = ({initialData}) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { t, language } = useTranslation();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState(initialData || []);
    // const [loading, setLoading] = useState(false)
    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    // Redux Selectors
    const actions = useSelector(
        (state) => state.auth?.actions || [],
        shallowEqual 
    ); // With shallowEqual - only re-renders if selected values actually changed
    const { loading , error } = useSelector(
        state => ({
          loading: state.categories.loading,
          error: state.categories.error
        }),
        shallowEqual
    )
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
    const requiredPermissions = ["delete_category"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
        router.push("/home");
    }
    }, [actions, router]);

    // Filter categories by search term (case-insensitive, both languages)
    const filteredCategories = (Array.isArray(categories) ? categories : []).filter(cat => {
        const name = cat.name?.[language] || cat.name?.en || '';
        return name.toLowerCase().includes(search.toLowerCase());
    });

    // handle edit click
    const handleEdit = (cat) => {
        setSelectedCategory(cat);
        setModalOpen(true);
    };

    // handle add click
    const handleAdd = () => {
        setSelectedCategory(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCategory(null);
    };

    // Handle delete click
    const handleDelete = (cat) => {
        setCategoryToDelete(cat);
        setDeleteDialogOpen(true);
    };

    // Handle delete confirmation - Fixed function
    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        console.log(categoryToDelete._id)
        try {
            await dispatch(deleteCategory(categoryToDelete._id)).unwrap();
            
            // Remove from local state
            setCategories(prev => 
                prev.filter(cat => cat._id !== categoryToDelete._id)
            );
            
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

    // Update list in UI after editing or adding new category
    const handleSaveSuccess = (updatedCat) => {
        if (selectedCategory) {
          // Update existing
          setCategories(prev =>
            prev.map(cat => cat._id === updatedCat._id ? updatedCat : cat)
          );
        } else {
          // Add new
          setCategories(prev => [...prev, updatedCat]);
        }
        setModalOpen(false);
    };
    return (
        <Dashboard>
            <CategoryModal
                open={modalOpen}
                handleClose={handleCloseModal}
                category={selectedCategory}
                onSave={handleSaveSuccess}
                language={language}
                t={t}
                loading={loading}
            />
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={handleDeleteDialogClose}
                onConfirm={handleDeleteConfirm}
                categoryName={categoryToDelete?.name?.[language] || categoryToDelete?.name?.en || categoryToDelete?.name || 'Unknown Category'}
                loading={loading}
                t={t}
            />
            <Box sx={{ p: 3 }}>
                <Breadcrumb 
                    sideNavItem={t("categories")} 
                    href="/dashboard/categories/list" 
                    urlText={t("categoriesList")}
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
                    value={search}
                    onChange={e => setSearch(e.target.value)}
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
                {filteredCategories.length === 0 ? (
                    <Typography sx={{ mx: 3 }} variant="body1">
                        {t('noCategoriesFound')}
                    </Typography>
                ) : (
                filteredCategories.map((cat) => (
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
                                                src={`/uploads/categories/images/${cat.image}`}
                                                alt={cat.name?.[language] || cat.name?.en || "Category"}
                                                width={80}
                                                height={80}
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                    border: '1px solid #ddd',
                                                }}
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
                                          {cat.name?.[language] || cat.name?.en || ''}
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