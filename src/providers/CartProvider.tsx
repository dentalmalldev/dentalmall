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

// Per-line pricing. For variant options the customer-facing price is dentalmall_price;
// plain products use `price`. `final` applies the sale price when present.
export function getCartItemPricing(item: CartItem): { original: number; final: number } {
  const original = item.variant_option
    ? parseFloat(item.variant_option.dentalmall_price)
    : parseFloat(item.product.price);
  const source = item.variant_option || item.product;
  const final = source.sale_price ? parseFloat(source.sale_price) : original;
  return { original, final };
}

/** Sum of post-discount line totals for a set of cart items. */
export function getCartItemsTotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + getCartItemPricing(item).final * item.quantity, 0);
}

/**
 * Split a cart into items kept in DentalMall storage vs. special-order items
 * (sourced from the vendor). Used by the cart page to show separate delivery
 * sections only when both kinds are present.
 */
export function partitionCartByStorage(items: CartItem[]): {
  inStorage: CartItem[];
  specialOrder: CartItem[];
} {
  const inStorage: CartItem[] = [];
  const specialOrder: CartItem[] = [];
  for (const item of items) {
    if (item.product.in_storage_stock) inStorage.push(item);
    else specialOrder.push(item);
  }
  return { inStorage, specialOrder };
}

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate cart totals
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce(
    (acc, item) => acc + getCartItemPricing(item).original * item.quantity,
    0
  );

  const discount = items.reduce((acc, item) => {
    const { original, final } = getCartItemPricing(item);
    return acc + (original - final) * item.quantity;
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
