'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { fetchAllActions, selectAllActions } from '@/store/slices/actionSlice';
import { updateRoleInList, assignActionToRole, removeActionFromRole } from '@/store/slices/roleSlice';
import { toast } from 'react-toastify';

export default function PermissionsModal({ open, handleClose, role, t }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    // Redux selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const { actionsList, loading: actionsLoading } = useSelector(selectAllActions);
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["assign_action_to_role", "remove_action_from_role"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Local state: selected action IDs
    const [selectedActionIds, setSelectedActionIds] = useState(new Set());

    // Sync role.actions on open
    useEffect(() => {
        if (open && role) {
        const actionIds = new Set(role.actions.map(a => a._id || a.id));
        setSelectedActionIds(actionIds);
        }
    }, [open, role]);

    // Fetch all actions when modal opens
    useEffect(() => {
        if (open) {
        dispatch(fetchAllActions());
        }
    }, [dispatch, open]);

    // 
    const handleToggle = (actionId) => {
        const updated = new Set(selectedActionIds);
        if (updated.has(actionId)) {
        updated.delete(actionId);
        } else {
        updated.add(actionId);
        }
        setSelectedActionIds(updated);
    };

    // Submit assigning/removing action handler
    const handleSubmit = async () => {
        if (!role?._id) return;

        setLoading(true);
        try {
            const currentActionIds = role.actions.map(a => a._id || a.id);
            const newActionIds = [...selectedActionIds];

            // Find added
            const toAdd = newActionIds.filter(id => !currentActionIds.includes(id));
            // Find removed
            const toRemove = currentActionIds.filter(id => !newActionIds.includes(id));

            let assignedCount = 0;
            let removedCount = 0;
            let updatedRole = null;

            // Batch updates with toast tracking
            if (toAdd.length > 0) {
            const result = await dispatch(assignActionToRole({ roleId: role._id, actionIds: toAdd })).unwrap();
            updatedRole = result.role; // Assume API returns updated role
            assignedCount = toAdd.length;
            }

            if (toRemove.length > 0) {
            const result = await dispatch(removeActionFromRole({ roleId: role._id, actionIds: toRemove })).unwrap();
            updatedRole = result.role; // Assume API returns updated role
            removedCount = toRemove.length;
            }

            // ✅ Sync back into roles list
            if (updatedRole) {
            dispatch(updateRoleInList(updatedRole)); // 👈 This updates the global roles list!
            // setSelectedRole(updatedRole); // Also update local modal state
            }

            // ✅ Show appropriate toast(s)
            if (assignedCount > 0 && removedCount > 0) {
            toast.success(`${t('actionsAssignedSuccessfully')} (${assignedCount}) | ${t('actionsRemovedSuccessfully')} (${removedCount})`);
            } else if (assignedCount > 0) {
            toast.success(t('actionsAssignedSuccessfully', { count: assignedCount }));
            } else if (removedCount > 0) {
            toast.success(t('actionsRemovedSuccessfully', { count: removedCount }));
            } else {
            // No changes
            toast.info(t('noPermissionsChanged'));
            }

            handleClose(); // Close after success
        } catch (err) {
            console.error('Failed to update permissions:', err);
            toast.error(t('failedToUpdatePermissions'));
        } finally {
            setLoading(false);
        }
        };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{role?.name ? `${t('managePermissions')} ${t('for')} ${role.name}: ${role.name}` : t('managePermissions')}</DialogTitle>
        <DialogContent dividers>
            {actionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
            ) : actionsList.length === 0 ? (
            <Typography color="text.secondary">{t('noActionsFound')}</Typography>
            ) : (
            <List>
                {actionsList.map((action) => (
                <ListItem key={action._id}>
                    <FormControlLabel
                    control={
                        <Checkbox
                        checked={selectedActionIds.has(action._id)}
                        onChange={() => handleToggle(action._id)}
                        />
                    }
                    label={action.name}
                    />
                </ListItem>
                ))}
            </List>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
                {t('cancel')}
            </Button>
            <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
            >
                {t('saveChanges')}
            </Button>
        </DialogActions>
        </Dialog>
    );
}