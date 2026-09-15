'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
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
  /**
   * Persist an "add to cart" intent for a logged-out user. After they sign in or
   * register, the item is added automatically (see the flush effect below). The
   * caller is responsible for opening the auth modal.
   */
  queueAddToCart: (productId: string, quantity?: number, variantId?: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// A logged-out add-to-cart intent, parked in sessionStorage until the user
// authenticates. Fired as a window event after a successful flush so a listener
// can show a confirmation toast (CartProvider sits above SnackbarProvider).
const PENDING_ADD_KEY = 'dm_pending_cart_add';
export const PENDING_CART_ADDED_EVENT = 'dm:pending-cart-added';

interface PendingAdd {
  productId: string;
  quantity: number;
  variantId: string | null;
}

function readPendingAdd(): PendingAdd | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_ADD_KEY);
    return raw ? (JSON.parse(raw) as PendingAdd) : null;
  } catch {
    return null;
  }
}

// Per-line pricing. The selected option (or the product itself) carries the
// selling `price`; `final` applies the sale price when present.
export function getCartItemPricing(item: CartItem): { original: number; final: number } {
  const source = item.variant_option || item.product;
  const original = parseFloat(source.price);
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
  const { user, dbUser } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  // Tracks the in-flight initial cart fetch so the pending-add flush can wait
  // for it and avoid being overwritten by a late-resolving GET.
  const fetchRef = useRef<Promise<void> | null>(null);
  const loadedUidRef = useRef<string | null>(null);
  // Guards for the pending-add flush. `flushing` blocks concurrent/StrictMode
  // re-entry; `flushed` blocks re-flushing after success. Both reset per user.
  const flushingRef = useRef(false);
  const flushedRef = useRef(false);

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

  // Load the cart once per signed-in user, keeping the fetch promise so the
  // pending-add flush can sequence itself after it.
  useEffect(() => {
    if (!user) {
      loadedUidRef.current = null;
      fetchRef.current = null;
      flushedRef.current = false;
      flushingRef.current = false;
      setItems([]);
      return;
    }
    if (loadedUidRef.current !== user.uid) {
      loadedUidRef.current = user.uid;
      flushedRef.current = false; // new signed-in user → allow one flush
      flushingRef.current = false;
      fetchRef.current = refreshCart();
    }
  }, [user, refreshCart]);

  const queueAddToCart = useCallback(
    (productId: string, quantity: number = 1, variantId?: string) => {
      if (typeof window === 'undefined') return;
      const intent: PendingAdd = { productId, quantity, variantId: variantId ?? null };
      window.sessionStorage.setItem(PENDING_ADD_KEY, JSON.stringify(intent));
    },
    []
  );

  // Flush a queued add once the account is fully ready. Gating on `dbUser`
  // guarantees the DB row exists, so the cart POST won't 404 for a brand-new
  // registration.
  useEffect(() => {
    if (!user || !dbUser) return;
    // Ref guards (not `cancelled` cleanup): `dbUser`/`user` object identity can
    // change several times right after sign-in (register sets it, then the
    // onAuthStateChanged retry sets it again). A cleanup-based cancel would abort
    // the in-flight POST and, since the intent was already consumed, silently
    // drop the item. Refs let exactly one flush run to completion across re-runs.
    if (flushedRef.current || flushingRef.current) return;

    const pending = readPendingAdd();
    if (!pending) return;

    flushingRef.current = true;
    (async () => {
      // Wait for the initial cart fetch so our optimistic update lands last.
      try {
        await fetchRef.current;
      } catch {
        /* fetch failure is handled in refreshCart; proceed with the add */
      }

      try {
        const newItem = await cartService.addToCart(
          user,
          pending.productId,
          pending.quantity,
          pending.variantId ?? undefined
        );
        // Consume the intent only after the add actually succeeds.
        flushedRef.current = true;
        window.sessionStorage.removeItem(PENDING_ADD_KEY);
        setItems((prevItems) => {
          const existingIndex = prevItems.findIndex(
            (item) =>
              item.product_id === pending.productId &&
              item.variant_option_id === pending.variantId
          );
          if (existingIndex >= 0) {
            const updated = [...prevItems];
            updated[existingIndex] = newItem;
            return updated;
          }
          return [newItem, ...prevItems];
        });
        window.dispatchEvent(new CustomEvent(PENDING_CART_ADDED_EVENT));
      } catch (error) {
        // Leave the intent in place so a later trigger can retry.
        console.error('Failed to add queued cart item after sign-in:', error);
      } finally {
        flushingRef.current = false;
      }
    })();
  }, [user, dbUser]);

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
    queueAddToCart,
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
