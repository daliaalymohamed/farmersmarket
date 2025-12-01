// app/cart/page.js
'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/translationContext';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import { Add, Remove, Delete as DeleteIcon, ShoppingCart } from '@mui/icons-material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { initializeCartItems, addItemToCart, removeItemFromCart, updateItemQuantity } from '@/store/slices/cartSlice';
import { selectCartItems, selectCartTotal, selectCartCount } from '@/store/slices/cartSlice';
import CartSummary from '@/components/cartSummary';

const CartList = ({ initialData }) => {
    const { t, language } = useTranslation();
    const dispatch = useDispatch();
    const router = useRouter();
    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    const items = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const count = useSelector(selectCartCount);
    const loading = useSelector(state => state.cart.loading);
    const error = useSelector(state => state.cart.error);
    
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
    if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

    const requiredPermissions = ["view_cart", "remove_from_cart"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
        router.push("/home");
    }
    }, [actions, actionsLoaded , router]);
    
    // ✅ Initialize Redux with server data on mount
    useEffect(() => {
        if (initialData?.items && Array.isArray(initialData.items)) {
        dispatch(initializeCartItems({ items: initialData.items }));
        }
    }, [dispatch, initialData]);

    // Update Item Quantity
    const handleUpdateQuantity = async (item, change) => {
        const newQty = item.quantity + change;
        if (newQty <= 0) return;

        // Optimistically update UI
        dispatch(updateItemQuantity({ productId: item.productId, quantity: newQty }));

        try {
            // ✅ Dispatch and wait for result
            await dispatch(addItemToCart({
                productId: item.productId,
                quantity: change // Send only the change
            })).unwrap();
        
        } catch (err) {
        toast.error(t('failedToUpdateCart'));
        dispatch(updateItemQuantity({ productId: item.productId, quantity: item.quantity })); // rollback
        }
    };

    // Remove Item from Cart
    const handleRemoveItem = async (productId) => {
        // Optimistically remove
        const removedItem = items.find(i => i.productId === productId);
        try {
            // ✅ Dispatch and wait for result
            await dispatch(removeItemFromCart({ productId })).unwrap();

            // Only show success if API succeeded
            toast.success(t('itemRemovedFromCart'));
        } catch (err) {
        toast.error(t('failedToRemoveItem'));
        // Rollback
        dispatch(addItemToCart(removedItem));
        }
    };

    // Empty Cart
    if (items.length === 0) {
        return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingCart color="disabled" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
            {t('yourCartIsEmpty')}
            </Typography>
            <Button variant="contained" onClick={() => router.push('/')}
                sx={{
                    mt: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    py: 1,
                    backgroundColor: 'text.primary',
                    color: '#fff',
                    '&:hover': {
                        backgroundColor: 'background.default',
                        color: 'background.paper'
                    }
                }}>
            {t('continueShopping')}
            </Button>
        </Box>
        );
    }
    return (
        <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
            {/* Page Title */}
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                {t('shoppingCart')} ({count})
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {/* Cart Table */}
            <Paper elevation={1}>
                <Table>
                    <TableHead>
                        <TableRow>
                        <TableCell>{t('product')}</TableCell>
                        <TableCell align="right">{t('price')}</TableCell>
                        <TableCell align="center">{t('quantity')}</TableCell>
                        <TableCell align="right">{t('total')}</TableCell>
                        <TableCell align="center">{t('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                        <TableRow key={item.productId} hover>
                            {/* Product Info */}
                            <TableCell>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: '#f5f5f5'
                                    }}
                                    >
                                    <img
                                        src={`/api/images/product/${item.image}`}
                                        alt={
                                            item.name?.[language] || 
                                            item.name?.en || 
                                            item.name || 
                                            'Unnamed Product'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    </Box>
                                    <Box>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {
                                            item.name?.[language] || 
                                            item.name?.en || 
                                            item.name || 
                                            'Unnamed Product'}
                                    </Typography>
                                    </Box>
                                </Stack>
                            </TableCell>

                            {/* Price */}
                            <TableCell align="right">
                                <Typography variant="body1">
                                    {t('EGP')} {(item.price ?? 0).toFixed(2)}
                                </Typography>
                            </TableCell>

                            {/* Quantity */}
                            <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                    <IconButton size="small" onClick={() => handleUpdateQuantity(item, -1)} aria-label={t('decreaseQuantity')}>
                                    <Remove fontSize="small" />
                                    </IconButton>
                                    <Typography variant="body1" sx={{ minWidth: 32, textAlign: 'center' }}>
                                    {item.quantity}
                                    </Typography>
                                    <IconButton size="small" onClick={() => handleUpdateQuantity(item, 1)} aria-label={t('increaseQuantity')} >
                                    <Add fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </TableCell>

                            {/* Total */}
                            <TableCell align="right">
                                <Typography variant="body1" fontWeight="bold">
                                    {t('EGP')} {((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                                </Typography>
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="center">
                                <IconButton color="error" onClick={() => handleRemoveItem(item.productId)} aria-label={t('delete')}>
                                    <DeleteIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Summary & Checkout */}
            <CartSummary />

            <Divider sx={{ my: 4 }} />

            {/* Continue Shopping */}
            <Box sx={{ textAlign: 'center' }}>
                <Button variant="outlined" onClick={() => router.push('/')}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        py: 1,
                        backgroundColor: 'text.primary',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: 'background.default',
                            color: 'background.paper'
                        }
                    }}>
                    {t('continueShopping')}
                </Button>
            </Box>
        </Box>
    );
};

export default CartList;