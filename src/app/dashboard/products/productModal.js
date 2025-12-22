'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Image from "next/image";
import { Box, Typography, Button, 
    TextField, InputLabel, Stack, Dialog, DialogActions, DialogContent, 
    DialogTitle, CircularProgress, MenuItem, FormControlLabel, 
    Checkbox, Chip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { addProduct, editProduct, updateProductInList } from '@/store/slices/productSlice';
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ButtonLoader from "@/components/UI/buttonLoader";
import { productSchema } from '@/lib/utils/validation';
import { toast } from "react-toastify";

// Product modal to edit and add new product
const ProductModal = memo(({ open, handleClose, product, t, loading, language, categories, vendors }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    // Local state for image preview
    // This will hold the image URL for previewing before submission
    // If category is provided, use its image; otherwise, default to an empty string
    // Local state for image preview
    const [imagePreview, setImagePreview] = useState(null);    
    const [hasNewImage, setHasNewImage] = useState(false);
    // local state for tags
    const [currentTagInput, setCurrentTagInput] = useState('');
    // Add state for duplicate error in your component
    const [duplicateTagError, setDuplicateTagError] = useState('');

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
    
        const requiredPermissions = ["edit_product", "add_product"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        
        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Utility function to format date for DateTimePicker
    const formatDateForInput = (date) => {
        if (!date) return null;
        
        try {
            let dayjsDate;
            
            // Handle different date formats
            if (typeof date === 'string') {
                dayjsDate = dayjs(date);
            } else if (date instanceof Date) {
                dayjsDate = dayjs(date);
            } else if (dayjs.isDayjs(date)) {
                dayjsDate = date;
            } else {
                return null;
            }
            
            // Validate the dayjs object
            if (!dayjsDate.isValid()) {
                console.warn('Invalid date provided:', date);
                return null;
            }
            
            return dayjsDate;
        } catch (error) {
            console.error('Error formatting date for input:', error, 'Date:', date);
            return null;
        }
    };

    // Product form hook with edit mode detection
    const isEditMode = !!(product && product._id);

    // ✅ Proper default values with consistent date handling
    const getDefaultValues = () => {      
        if (product) {
            const formattedSaleStart = formatDateForInput(product.saleStart);
            const formattedSaleEnd = formatDateForInput(product.saleEnd);
            
            return {
                name: {
                    en: product.name?.en || '',
                    ar: product.name?.ar || '',
                },
                description: {
                    en: product.description?.en || '',
                    ar: product.description?.ar || '',
                },
                price: product.price || 0,
                categoryId: product.categoryId?._id || product.categoryId || '',
                stock: product.stock || 0,
                vendorId: product.vendorId?._id || product.vendorId || '',
                isActive: product.isActive !== undefined ? product.isActive : true,
                isFeatured: Boolean(product.isFeatured || false),
                image: product.image || null,
                isOnSale: Boolean(product?.isOnSale ?? false),
                salePrice: product.salePrice || 0,
                saleStart: formattedSaleStart, // ✅ Use formatted date
                saleEnd: formattedSaleEnd,     // ✅ Use formatted date
                tags: Array.isArray(product.tags) ? product.tags : [],
            };
        } else {
            return {
                name: { en: '', ar: '' },
                description: { en: '', ar: '' },
                price: 0,
                categoryId: '',
                stock: 0,
                vendorId: '',
                isActive: true,
                isFeatured: false,
                image: null,
                isOnSale: false,
                salePrice: 0,
                saleStart: null,
                saleEnd: null,
                tags: [],
            };
        }
    };
    // Product form hook
      const {
        register,
        handleSubmit: handleSubmitProduct,
        control,
        setValue,
        getValues,
        watch,
        reset,
        formState: { errors, isValid },
        clearErrors,
      } = useForm({
        mode: 'onChange',
        resolver: yupResolver(productSchema(t, isEditMode)),
        defaultValues: getDefaultValues(),
        shouldUnregister: true,
      });
    
    // Reset form and image preview and isOnSale when modal opens/closes or product changes
    // 1. Debug form reset triggers
    useEffect(() => {
        if (open && product) {
            const defaultValues = getDefaultValues();
            
            // Step 1: Reset entire form
            reset(defaultValues);

            // Step 2: Force update complex fields
            // Force update fields that may not register properly
            // ✅ Use setTimeout to ensure form is fully reset before setting individual values
            setTimeout(() => {
                // Force update complex fields that may not register properly
                setValue('isOnSale', defaultValues.isOnSale, { shouldValidate: false, shouldDirty: false });
                setValue('tags', defaultValues.tags, { shouldValidate: false, shouldDirty: false });
                
                // ✅ Explicitly set date values
                if (defaultValues.saleStart) {
                    setValue('saleStart', defaultValues.saleStart, { shouldValidate: false, shouldDirty: false });
                }
                if (defaultValues.saleEnd) {
                    setValue('saleEnd', defaultValues.saleEnd, { shouldValidate: false, shouldDirty: false });
                }
            }, 50); // Small delay to ensure form is ready


            // Set image preview for existing product
            if (product?.image) {
                setImagePreview(`/api/images/product/${product.image}`);
            } else {
                setImagePreview(null);
            }
            
            setHasNewImage(false);
            setCurrentTagInput('');
            setDuplicateTagError('');
        } else {
            // ✅ Clear all errors when modal closes
            clearErrors();
        }
        
        // Cleanup blob URLs when component unmounts or modal closes
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [open, product, reset, clearErrors, setValue]);

    const isOnSale = useWatch({ control, name: 'isOnSale'});

    useEffect(() => {
        if (!isOnSale) {
            // Clear values
            setValue('saleStart', null, { shouldValidate: false });
            setValue('saleEnd', null, { shouldValidate: false });
            
            // Clear errors
            clearErrors(['saleStart', 'saleEnd']);
        } else if (isOnSale && product) {
            // ✅ Re-populate dates when switching back to on sale in edit mode
            const defaultValues = getDefaultValues();
            if (defaultValues.saleStart) {
                setValue('saleStart', defaultValues.saleStart, { shouldValidate: false });
            }
            if (defaultValues.saleEnd) {
                setValue('saleEnd', defaultValues.saleEnd, { shouldValidate: false });
            }
        }
    }, [isOnSale, setValue, clearErrors, product]);

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

    // Handle Category change
    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setValue('categoryId', categoryId, { shouldValidate: true });
    }

    // Handle Vendor change
    const handleVendorChange = (e) => {
        const vendorId = e.target.value;
        setValue('vendorId', vendorId, { shouldValidate: true });
    }

    // Handle tag input change
    const handleTagInputChange = (e) => {
        setCurrentTagInput(e.target.value)
        // Clear duplicate error when user starts typing
        if (duplicateTagError) {
            setDuplicateTagError('');
        }
    }

    // Handle tag key down event
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = currentTagInput.trim();
            
            if (newTag && newTag.length > 0) {
                const currentTags = watch('tags') || [];
                
                // Check if tag already exists (case insensitive)
                const tagExists = currentTags.some(
                    tag => tag.toLowerCase() === newTag.toLowerCase()
                );
                
                if (tagExists) {
                    // Set duplicate error message
                    setDuplicateTagError(t('tagsUniqueError'));
                    // Clear error after 3 seconds
                    setTimeout(() => setDuplicateTagError(''), 3000);
                    return;
                }
                
                // Clear duplicate error if tag is valid
                setDuplicateTagError('');
                
                const updatedTags = [...currentTags, newTag];
                setValue('tags', updatedTags, { shouldValidate: true });
                setCurrentTagInput(''); // Clear input after adding
            }
        }
    }

    // Convert date strings back to ISO format for API
    const formatDateForAPI = (dayjsDate) => {
        if (!dayjsDate) return null;
        try {
            return dayjsDate.toISOString();
        } catch (error) {
            console.error('Error formatting date for API:', error);
            return null;
        }
    };
   
    // Handle form submission for adding/editing product
    const onSubmitProduct = async (data) => {
        try {
            let payload;
            // Ensure isOnSale is a real boolean
            const isOnSale = Boolean(data.isOnSale);

            if (isEditMode) {
                // Edit existing category
                if (hasNewImage && data.image instanceof File) {
                    // Use FormData when uploading a new file
                    payload = new FormData();
                    payload.append('name.en', data.name.en);
                    payload.append('name.ar', data.name.ar);
                    payload.append('description.en', data.description.en);
                    payload.append('description.ar', data.description.ar);
                    payload.append('price', data.price);
                    payload.append('categoryId', data.categoryId);
                    payload.append('stock', data.stock);
                    payload.append('vendorId', data.vendorId);
                    payload.append('isActive', data.isActive);
                    payload.append('isFeatured', data.isFeatured);
                    payload.append('isOnSale', data.isOnSale);
                    payload.append('salePrice', data.salePrice);
                   // Only append sale dates if on sale
                    if (isOnSale) {
                        const saleStartFormatted = formatDateForAPI(data.saleStart);
                        const saleEndFormatted = formatDateForAPI(data.saleEnd);
                        if (saleStartFormatted) payload.append('saleStart', saleStartFormatted);
                        if (saleEndFormatted) payload.append('saleEnd', saleEndFormatted);
                    } else {
                        // Clear dates when not on sale
                        payload.append('saleStart', '');
                        payload.append('saleEnd', '');
                    }
                    payload.append('tags', JSON.stringify(data.tags));
                    payload.append('image', data.image);
                } else {
                    // Use JSON when no new file upload
                    payload = { 
                        name: data.name,
                        description: data.description,
                        price: data.price,
                        categoryId: data.categoryId,
                        stock: data.stock,
                        vendorId: data.vendorId,
                        isActive: data.isActive,
                        isFeatured: data.isFeatured,
                        isOnSale: isOnSale,
                        salePrice: data.salePrice,
                        saleStart: data.isOnSale ? formatDateForAPI(data.saleStart) : null,
                        saleEnd: data.isOnSale ? formatDateForAPI(data.saleEnd) : null,
                        tags: data.tags,
                        // Keep existing image if no new file
                        ...(product.image && !hasNewImage && { image: product.image })
                    };
                }
                
                const result = await dispatch(editProduct({
                    productId: product._id, 
                    productData: payload
                })).unwrap();

                // Ensure UI reflects changes immediately
                if (result?.product) {
                    dispatch(updateProductInList(result.product));
                }

                // Set image preview if product has an image
                // This ensures the preview updates after editing
                if (result?.product?.image) {
                    setImagePreview(`/api/images/product/${result.product.image}`);
                }
                toast.success(t('productUpdatedSuccessfully'));
            } else {
                // Add new category - always use FormData for new categories
                payload = new FormData();
                payload.append('name.en', data.name.en);
                payload.append('name.ar', data.name.ar);
                payload.append('description.en', data.description.en);
                payload.append('description.ar', data.description.ar);
                payload.append('price', data.price);
                payload.append('categoryId', data.categoryId);
                payload.append('stock', data.stock);
                payload.append('vendorId', data.vendorId);
                payload.append('isActive', data.isActive);
                payload.append('isFeatured', data.isFeatured);
                payload.append('isOnSale', isOnSale);
                payload.append('salePrice', data.salePrice);
                // Only append dates if on sale
                if (isOnSale) {
                    const saleStartFormatted = formatDateForAPI(data.saleStart);
                    const saleEndFormatted = formatDateForAPI(data.saleEnd);
                    if (saleStartFormatted) payload.append('saleStart', saleStartFormatted);
                    if (saleEndFormatted) payload.append('saleEnd', saleEndFormatted);
                }
                payload.append('tags', JSON.stringify(data.tags));
                
                // Only append image if one was selected
                if (data.image instanceof File) {
                    payload.append('image', data.image);
                }
                
                const result = await dispatch(addProduct(payload)).unwrap();
                if (result?.product?.image) {
                    setImagePreview(`/api/images/product/${result.product.image}`);
                  }
                toast.success(t('productAddedSuccessfully'));
            }
            
            // Close modal after submission
            handleClose();
            
        } catch (err) {
            toast.error(t('productSaveFailed'));
            if (err.details) {
                toast.error(err.details);
            }
        }
    };
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {product ? t('editProduct') : t('addProduct')}
            </DialogTitle>
            <form onSubmit={handleSubmitProduct(onSubmitProduct)} encType="multipart/form-data">
                <DialogContent>
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2}>
                            <>
                                <TextField
                                    label={t('productNameEn')}
                                    {...register('name.en')}
                                    error={!!errors?.name?.en}
                                    helperText={errors?.name?.en?.message}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label={t('productNameAr')}
                                    {...register('name.ar')}
                                    error={!!errors?.name?.ar}
                                    helperText={errors?.name?.ar?.message}
                                    fullWidth
                                    required
                                />
                            </>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label={t('productDescriptionEn')}
                                {...register('description.en')}
                                error={!!errors?.description?.en}
                                helperText={errors?.description?.en?.message}
                                fullWidth
                                multiline
                                rows={4}
                                required
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label={t('productDescriptionAr')}
                                {...register('description.ar')}
                                error={!!errors?.description?.ar}
                                helperText={errors?.description?.ar?.message}
                                fullWidth
                                multiline
                                rows={4}
                                required
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <>
                                <TextField
                                    label={t('productPrice')}
                                    {...register('price')}
                                    error={!!errors?.price}
                                    helperText={errors?.price?.message}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label={t('productStock')}
                                    {...register('stock')}
                                    error={!!errors?.stock}
                                    helperText={errors?.stock?.message}
                                    fullWidth
                                    required
                                />
                            </>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <>
                                {!categories ? (
                                    <CircularProgress size={24} />
                                ) 
                                : categories.length === 0 ? (
                                    <Typography color="error">{t('noCategoriesFound')}</Typography>
                                )
                                : 
                                (
                                    <TextField
                                        select
                                        label={t('productCategory')}
                                        {...register('categoryId')}
                                        value={watch('categoryId') || ''} // Get current value from form
                                        onChange={handleCategoryChange}
                                        error={!!errors?.categoryId}
                                        helperText={errors?.categoryId?.message}
                                        fullWidth
                                        required
                                    >
                                        <MenuItem value="">{t('selectCategory')}</MenuItem>
                                        {categories?.map((category) => (
                                            <MenuItem key={category._id} value={category._id}>
                                                {category.name?.[language] || category.name?.en || category.name?.ar || "Category"}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <>
                                {!vendors ? (
                                    <CircularProgress size={24} />
                                ) 
                                : vendors.length === 0 ? (
                                    <Typography color="error">{t('noVendorsFound')}</Typography>
                                )
                                : 
                                (
                                    <TextField
                                        select
                                        label={t('productVendor')}
                                        {...register('vendorId')}
                                        value={watch('vendorId') || ''} // Get current value from form
                                        onChange={handleVendorChange}
                                        error={!!errors?.vendorId}
                                        helperText={errors?.vendorId?.message}
                                        fullWidth
                                        required
                                    >
                                        <MenuItem value="">{t('selectVendor')}</MenuItem>
                                        {vendors?.map((vendor) => (
                                            <MenuItem key={vendor._id} value={vendor._id}>
                                                {vendor?.name || "Vendor"}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={field.value || false}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
                                        label={t('active')}
                                    />
                                )}
                            />
                            <Controller
                                name="isFeatured"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={field.value || false}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
                                        label={t('featured')}
                                    />
                                )}
                            />
                            <Controller
                                name="isOnSale"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={field.value || false}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        }
                                        label={t('onSale')}
                                    />
                                )}
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label={t('productSalePrice')}
                                {...register('salePrice')}
                                error={!!errors?.salePrice}
                                helperText={errors?.salePrice?.message || ''}
                                fullWidth
                                required={isOnSale}
                                disabled={!isOnSale}
                                />
                           
                        </Stack>                       
                        {isOnSale === true && (
                            <LocalizationProvider key={`date-picker-${isOnSale}-${product?._id || 'new'}`} dateAdapter={AdapterDayjs}>
                                <Stack direction="row" spacing={2}>
                                    <Controller
                                        name="saleStart"
                                        control={control}
                                        render={({ field }) => {                                            
                                            return (
                                                <DateTimePicker
                                                    label={t("productSaleStart")}
                                                    value={field.value || null} // ✅ Ensure null instead of undefined
                                                    onChange={(newValue) => {
                                                        field.onChange(newValue);
                                                    }}
                                                    disabled={!isOnSale}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.saleStart,
                                                            helperText: errors.saleStart?.message
                                                        }
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    
                                    <Controller
                                        name="saleEnd"
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <DateTimePicker
                                                    label={t("productSaleEnd")}
                                                    value={field.value || null} // ✅ Ensure null instead of undefined
                                                    onChange={(newValue) => {
                                                        field.onChange(newValue);
                                                    }}
                                                    disabled={!isOnSale}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.saleEnd,
                                                            helperText: errors.saleEnd?.message
                                                        }
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                </Stack>
                            </LocalizationProvider>
                        )}
                        <Stack spacing={1}>
                            <InputLabel shrink>{t('productTags')}</InputLabel>
                            
                            {/* Display current tags as chips */}
                            {watch('tags') && watch('tags').length > 0 && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 0.5, 
                                    mb: 1,
                                    p: 1,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    backgroundColor: '#fafafa'
                                }}>
                                    {watch('tags').map((tag, index) => (
                                        <Chip 
                                            key={index} 
                                            label={tag} 
                                            size="small" 
                                            variant="filled"
                                            color="primary"
                                            onDelete={() => {
                                                const currentTags = watch('tags') || [];
                                                const newTags = currentTags.filter((_, i) => i !== index);
                                                setValue('tags', newTags, { shouldValidate: true });
                                                // Clear duplicate error when removing tags
                                                if (duplicateTagError) {
                                                    setDuplicateTagError('');
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Tag input field */}
                            <TextField
                                label={t('addTags')}
                                placeholder={t('typeAndPressEnter')}
                                value={currentTagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleTagKeyDown}
                                error={!!duplicateTagError || !!errors?.tags}
                                helperText={
                                    duplicateTagError || // Show duplicate error first if exists
                                    errors?.tags?.message || // Then show other validation errors
                                    t('pressEnterOrCommaToAddTag') // Default helper text
                                }
                                fullWidth
                                size="small"
                            />
                        </Stack>
                        <Stack spacing={1}>
                            <InputLabel shrink>{t('productImage')}</InputLabel>
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
                                        alt={product?.name?.[language] || product?.name?.en || product?.name?.ar || t('product')}
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

export default ProductModal;