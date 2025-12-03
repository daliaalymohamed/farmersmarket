// components/CartInitializer.js
'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart } from '@/store/slices/cartSlice';
import { selectCartLoaded } from '@/store/slices/cartSlice'; 

const CartInitializer = () => {
    const dispatch = useDispatch();
    const cartLoaded = useSelector(selectCartLoaded);
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token && !!user;


    if (!cartLoaded && isLoggedIn) {
      dispatch(fetchCart());
    }
  }, [dispatch, cartLoaded, user]);

    return null;
};

export default CartInitializer;