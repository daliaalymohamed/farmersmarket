'use client';

import { Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import ButtonLoader from "@/components/UI/buttonLoader";

// Delete Confirmation Dialog Component
const DeleteConfirmDialog = ({ open, onClose, dialogTitle, dialogConfirmMsg, cancelButtonText, onConfirm, loading, 
    deleteButtonText }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogContent>
                <Typography>
                   {dialogConfirmMsg}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {cancelButtonText}
                </Button>
                <Button 
                    onClick={onConfirm} 
                    color="error" 
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? <ButtonLoader /> : deleteButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmDialog;