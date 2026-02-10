'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { cartService } from '@/services';
import { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate cart totals
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce((acc, item) => {
    const source = item.variant_option || item.product;
    const price = parseFloat(source.price);
    return acc + price * item.quantity;
  }, 0);

  const discount = items.reduce((acc, item) => {
    const source = item.variant_option || item.product;
    const price = parseFloat(source.price);
    const salePrice = source.sale_price ? parseFloat(source.sale_price) : price;
    return acc + (price - salePrice) * item.quantity;
  }, 0);

  const total = subtotal - discount;

  // Fetch cart on user change
  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const cartItems = await cartService.getCart(user);
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: string, quantity: number = 1, variantId?: string) => {
      if (!user) {
        throw new Error('User must be logged in to add items to cart');
      }

      setLoading(true);
      try {
        const newItem = await cartService.addToCart(user, productId, quantity, variantId);

        setItems((prevItems) => {
          const existingIndex = prevItems.findIndex(
            (item) => item.product_id === productId && item.variant_option_id === (variantId || null)
          );
          if (existingIndex >= 0) {
            const updated = [...prevItems];
            updated[existingIndex] = newItem;
            return updated;
          }
          return [newItem, ...prevItems];
        });
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (!user) return;

      setLoading(true);
      try {
        const updatedItem = await cartService.updateQuantity(user, cartItemId, quantity);
        setItems((prevItems) =>
          prevItems.map((item) => (item.id === cartItemId ? updatedItem : item))
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      if (!user) return;

      setLoading(true);
      try {
        await cartService.removeFromCart(user, cartItemId);
        setItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const clearCart = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await cartService.clearCart(user);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = {
    items,
    loading,
    itemCount,
    subtotal,
    discount,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
