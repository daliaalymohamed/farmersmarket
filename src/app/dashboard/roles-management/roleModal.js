'use client';

import { useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Button, TextField, Stack, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { addRole, editRole, updateRoleInList } from '@/store/slices/roleSlice';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ButtonLoader from "@/components/UI/buttonLoader";
import { roleSchema } from '@/lib/utils/validation';
import { toast } from "react-toastify";

// Role modal to edit and add new role
const RoleModal = memo(({ open, handleClose, role, t, loading }) => {
    const router = useRouter();
    const dispatch = useDispatch();

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

        const requiredPermissions = ["add_role", "edit_role"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Vendor form hook with edit mode detection
    const isEditMode = !!(role && role._id);

    // ✅ Proper default values with consistent date handling
    const getDefaultValues = () => {
        if (role) {
            return {
                name: role.name || '',
            };
        } else {
            return {
                name: ''
            }
        }
    };
    // Role form hook
      const {
        register,
        handleSubmit: handleSubmitRole,
        reset,
        formState: { errors, isSubmitting },
      } = useForm({
        mode: 'onChange',
        resolver: yupResolver(roleSchema(t, isEditMode)),
        defaultValues: getDefaultValues()
      });

    // Reset form when modal opens/closes or role changes
    // 1. Debug form reset triggers
    useEffect(() => {
        if (open) {
            const defaultValues = getDefaultValues();
            reset(defaultValues);
        }
    }, [open, role?._id, role?.name, reset]);

     
    // Handle form submission for adding/editing role
    const onSubmitRole = async (data) => {
        try {
            let payload;

            payload = { 
                name: data.name
            };
            if (isEditMode) {
                
                const result = await dispatch(editRole({
                    roleId: role._id, 
                    roleData: payload
                })).unwrap();

                // Ensure UI reflects changes immediately
                if (result?.role) {
                    dispatch(updateRoleInList(result.role));
                }

                toast.success(t('roleUpdatedSuccessfully'));
            } else {
                // Add new role - always use FormData for new roles
                const result = await dispatch(addRole(payload)).unwrap();
                // Ensure UI reflects changes immediately
                if (result?.role) {
                    dispatch(updateRoleInList(result.role));
                }
                toast.success(t('roleAddedSuccessfully'));
            }
            
            // Close modal after submission
            handleClose();
            
        } catch (err) {
            toast.error(t('roleSaveFailed'));
            if (err.details) {
                toast.error(err.details);
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {role ? t('editRole') : t('addRole')}
            </DialogTitle>
            <form onSubmit={handleSubmitRole(onSubmitRole)} encType="multipart/form-data">
                <DialogContent>
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2}>
                            <>
                                <TextField
                                    label={t('roleName')}
                                    {...register('name')}
                                    error={!!errors?.name}
                                    helperText={errors?.name?.message}
                                    fullWidth
                                    required
                                />
                            </>
                        </Stack>
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

export default RoleModal;