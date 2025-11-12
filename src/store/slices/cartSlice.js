import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { cartApi } from "@/lib/services/apis/cartApi"; 
import { getCartItems } from '@/app/actions/cart/serverCartData';

// ✅ Async Thunk: Fetch Cart
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const data = await getCartItems(filters);
      return data.cart || { cartItems: [] };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

// ✅ Async Thunk: Add Item to Cart
export const addItemToCart = createAsyncThunk(
  'cart/addItemToCart',
  async (itemData, { rejectWithValue }) => {
    try {
      const data = await cartApi.addItemToCart(itemData);
      console.log("data ", data)
      return data.cart;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item');
    }
  }
);

// ✅ Async Thunk: Remove Item from Cart
export const removeItemFromCart = createAsyncThunk(
  'cart/removeItemFromCart',
  async ({ productId }, { rejectWithValue }) => {
    try {
      const data = await cartApi.removeItemFromCart(productId);
      return data.cart;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item');
    }
  }
);

// ✅ Initial state for the cart slice
const initialState = {
    cartItems: [],
    loading: false,
    error: null,
 };
  
const cartSlice = createSlice({
  name: "cart",
  initialState: initialState,
  reducers: {
    // Initialize vendors with data from server
    // This is useful when the modal opens or when the page loads
    // It sets the cartList
    initializeCartItems: (state, action) => {
        const { cartItems } = action.payload;
        state.cartItems = cartItems || [];
    },
    // Optional: Local-only update (e.g., quantity change before API sync - when not loggedin)
    updateItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.cartItems.find(i => i.productId === productId);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
    clearCart: (state) => {
      state.cartItems = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // 🔹 FETCH CART
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.cartItems = action.payload?.cart?.cartItems || 
                    action.payload?.cart?.items || [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 ADD ITEM TO CART
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems =  action.payload.cartItems || [];
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 REMOVE ITEM FROM CART
      .addCase(removeItemFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems =  action.payload.cartItems || [];
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }

});

// ✅ Selectors
// ✅ createSelector memoizes the result
// ✅ Only recalculates when cartItems actually changes (by reference)
// ✅ Prevents unnecessary re-renders
// ✅ Eliminates the warning
const selectCartState = (state) => state.cart;

export const selectCartItems = createSelector(
  [selectCartState],
  (cart) => cart.cartItems || []
);

export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

export const selectCartCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => {
    return items.reduce((total, item) => {
      const price = item.salePrice > 0 ? item.salePrice : item.price;
      return total + price * item.quantity;
    }, 0);
  }
);

export const { initializeCartItems, updateItemQuantity, clearCart } = cartSlice.actions;

export default cartSlice.reducer;