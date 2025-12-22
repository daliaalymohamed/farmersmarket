'use client';

import { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Button, TextField, Stack, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem } from '@mui/material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { addWarehouse, editWarehouse, updateWarehouseInList } from '@/store/slices/warehouseSlice';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ButtonLoader from "@/components/UI/buttonLoader";
import { warehouseSchema } from '@/lib/utils/validation';
import { toast } from "react-toastify";

// Warehouse modal to edit and add new warehouse
const WarehouseModal = memo(({ open, handleClose, warehouse, t, loading }) => {
    const router = useRouter();
    const dispatch = useDispatch();

    // Redux Selectors
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    
    // Check permissions on mount
    useEffect(() => {
        if (!actionsLoaded) return;

        const requiredPermissions = ["add_warehouse", "edit_warehouse"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Warehouse form hook with edit mode detection
    const isEditMode = !!(warehouse && warehouse._id);

    // ✅ Proper default values
    const getDefaultValues = () => {
        if (warehouse) {
            return {
                name: warehouse.name || '',
                address: {
                    street: warehouse.address?.street || '',
                    city: warehouse.address?.city || '',
                    state: warehouse.address?.state || '',
                    zipCode: warehouse.address?.zipCode || '',
                    country: warehouse.address?.country || '',
                },
                contactInfo: {
                    phone: warehouse.contactInfo?.phone || '',
                    email: warehouse.contactInfo?.email || '',
                    contactPerson: warehouse.contactInfo?.contactPerson || '',
                },
                capacity: warehouse.capacity || '',
                managerId: warehouse.managerId?._id || '',
            };
        } else {
            return {
                name: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                },
                contactInfo: {
                    phone: '',
                    email: '',
                    contactPerson: '',
                },
                capacity: '',
                managerId: '',
            }
        }
    };

    // Warehouse form hook
    const {
        register,
        control,
        handleSubmit: handleSubmitWarehouse,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: 'onChange',
        resolver: yupResolver(warehouseSchema(t, isEditMode)),
        defaultValues: getDefaultValues()
    });

    // Reset form when modal opens/closes or warehouse changes
    useEffect(() => {
        if (open) {
            const defaultValues = getDefaultValues();
            reset(defaultValues);
        }
    }, [open, warehouse?._id, reset]);

    // Handle form submission for adding/editing warehouse
    const onSubmitWarehouse = async (data) => {
        console.log("Submitting warehouse data:", data);
        try {
            let payload = { 
                ...data
            };

            if (isEditMode) {
                const result = await dispatch(editWarehouse({
                    warehouseId: warehouse._id, 
                    warehouseData: payload
                })).unwrap();

                if (result?.warehouse) {
                    dispatch(updateWarehouseInList(result.warehouse));
                }

                toast.success(t('warehouseUpdatedSuccessfully'));
            } else {
                const result = await dispatch(addWarehouse(payload)).unwrap();
                
                if (result?.warehouse) {
                    dispatch(updateWarehouseInList(result.warehouse));
                }
                toast.success(t('warehouseAddedSuccessfully'));
            }
            
            handleClose();
            
        } catch (err) {
            toast.error(t('warehouseSaveFailed'));
            if (err.details) {
                toast.error(err.details);
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {warehouse ? t('editWarehouse') : t('addWarehouse')}
            </DialogTitle>
            <form onSubmit={handleSubmitWarehouse(onSubmitWarehouse)}>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            label={t('warehouseName')}
                            {...register('name')}
                            error={!!errors?.name}
                            helperText={errors?.name?.message}
                            fullWidth
                            required
                        />

                        <TextField
                            label={t('street')}
                            {...register('address.street')}
                            error={!!errors?.address?.street}
                            helperText={errors?.address?.street?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('city')}
                            {...register('address.city')}
                            error={!!errors?.address?.city}
                            helperText={errors?.address?.city?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('state')}
                            {...register('address.state')}
                            error={!!errors?.address?.state}
                            helperText={errors?.address?.state?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('zipCode')}
                            {...register('address.zipCode')}
                            error={!!errors?.address?.zipCode}
                            helperText={errors?.address?.zipCode?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('country')}
                            {...register('address.country')}
                            error={!!errors?.address?.country}
                            helperText={errors?.address?.country?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('phone')}
                            {...register('contactInfo.phone')}
                            error={!!errors?.contactInfo?.phone}
                            helperText={errors?.contactInfo?.phone?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('email')}
                            {...register('contactInfo.email')}
                            error={!!errors?.contactInfo?.email}
                            helperText={errors?.contactInfo?.email?.message}
                            fullWidth
                            type="email"
                        />

                        <TextField
                            label={t('contactPerson')}
                            {...register('contactInfo.contactPerson')}
                            error={!!errors?.contactInfo?.contactPerson}
                            helperText={errors?.contactInfo?.contactPerson?.message}
                            fullWidth
                        />

                        <TextField
                            label={t('capacity')}
                            {...register('capacity')}
                            error={!!errors?.capacity}
                            helperText={errors?.capacity?.message}
                            fullWidth
                            type="number"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} variant="outlined">{t('cancel')}</Button>
                    <Button variant="contained" color="primary" type="submit" disabled={loading || isSubmitting}>
                        {(loading || isSubmitting) ? <ButtonLoader /> : t('saveChanges')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
})

export default WarehouseModal;
