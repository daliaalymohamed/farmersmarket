'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Image from "next/image";
import { Box, Typography, Button, 
    TextField, InputLabel, Stack, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { addCategory, editCategory } from '@/store/slices/categorySlice';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ButtonLoader from "@/components/UI/buttonLoader";
import { categorySchema } from '@/lib/utils/validation';
import { toast } from "react-toastify";

// Category modal to edit and add new category
const CategoryModal = memo(({ open, handleClose, category, t, loading, language }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    // Local state for image preview
    // This will hold the image URL for previewing before submission
    // If category is provided, use its image; otherwise, default to an empty string
    // Local state for image preview
    const [imagePreview, setImagePreview] = useState(null);
    const [hasNewImage, setHasNewImage] = useState(false);

    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["edit_category", "add_category"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        
        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);



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

    // Reset form and image preview when modal opens/closes or category changes
    useEffect(() => {
        if (open) {
            if (category) {
                // Edit mode
                reset({
                    name: {
                        en: category.name?.en || '',
                        ar: category.name?.ar || '',
                    },
                    color: category.color || '#1976d2',
                    image: category.image || null,
                });
                
                // Set image preview for existing category
                if (category.image) {
                    setImagePreview(`/api/images/category/${category.image}`);
                } else {
                    setImagePreview(null);
                }
            } else {
                // Add mode
                reset({
                    name: { en: '', ar: '' },
                    color: '#1976d2',
                    image: null
                });
                setImagePreview(null);
            }
            setHasNewImage(false);
        }
        
        // Cleanup blob URLs when component unmounts or modal closes
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [open, category, reset]);
    
         
    // Handle image file input and preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Clean up previous blob URL
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            
            setValue('image', file, { shouldValidate: true });
            setImagePreview(URL.createObjectURL(file));
            setHasNewImage(true);
        }
    };

    // Handle form submission for adding/editing category
    const onSubmitCategory = async (data) => {
        try {
            let payload;
            
            if (isEditMode) {
                // Edit existing category
                if (hasNewImage && data.image instanceof File) {
                    // Use FormData when uploading a new file
                    payload = new FormData();
                    payload.append('name.en', data.name.en);
                    payload.append('name.ar', data.name.ar);
                    payload.append('color', data.color);
                    payload.append('image', data.image);
                } else {
                    // Use JSON when no new file upload
                    payload = { 
                        name: data.name,
                        color: data.color,
                        // Keep existing image if no new file
                        ...(category.image && !hasNewImage && { image: category.image })
                    };
                }
                
                const result = await dispatch(editCategory({
                    categoryId: category._id, 
                    categoryData: payload
                })).unwrap();
                
                if (result?.category?.image) {
                    setImagePreview(`/api/images/category/${result.category.image}`);
                }
                toast.success(t('categoryUpdatedSuccessfully'));
            } else {
                // Add new category - always use FormData for new categories
                payload = new FormData();
                payload.append('name.en', data.name.en);
                payload.append('name.ar', data.name.ar);
                payload.append('color', data.color);
                
                // Only append image if one was selected
                if (data.image instanceof File) {
                    payload.append('image', data.image);
                }
                
                const result = await dispatch(addCategory(payload)).unwrap();
                if (result?.category?.image) {
                    setImagePreview(`/api/images/category/${result.category.image}`);
                  }
                toast.success(t('categoryAddedSuccessfully'));
            }
            
            // Close modal after submission
            handleClose();
            
        } catch (err) {
            console.error('Category save error:', err);
            toast.error(t('categorySaveFailed'));
            if (err.details) {
                toast.error(err.details);
            }
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
                                    label={t('categoryNameEn')}
                                    {...register('name.en')}
                                    error={!!errors?.name?.en}
                                    helperText={errors?.name?.en?.message}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label={t('categoryNameAr')}
                                    {...register('name.ar')}
                                    error={!!errors?.name?.ar}
                                    helperText={errors?.name?.ar?.message}
                                    fullWidth
                                    required
                                />
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
                                    <Image
                                        src={imagePreview}
                                        alt={category?.name?.[language] || category?.name?.en || category?.name?.ar || t('category')}
                                        width={400}
                                        height={400}
                                        style={{
                                            objectFit: 'contain',
                                            margin: 'auto',
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
})

export default CategoryModal;