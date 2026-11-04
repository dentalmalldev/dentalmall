'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { favoritesService } from '@/services';
import type { FavoriteItem } from '@/types';

interface FavoritesContextType {
  /** The visible list (products of unpublished stores are left out). */
  items: FavoriteItem[];
  loading: boolean;
  /** Matches the hearts: updates the moment one is toggled. */
  count: number;
  isFavorite: (productId: string) => boolean;
  /** Saves or removes the product. Throws if the request fails (the heart reverts). */
  toggleFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  /**
   * Persist a "favorite" intent for a logged-out user. After they sign in or
   * register, the product is saved automatically (see the flush effect below).
   * The caller is responsible for opening the auth modal.
   */
  queueFavorite: (productId: string) => void;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// A logged-out favorite intent, parked in sessionStorage until the user
// authenticates. Fired as a window event after a successful flush so a listener
// can show a confirmation toast (this provider sits above SnackbarProvider).
const PENDING_FAVORITE_KEY = 'dm_pending_favorite';
export const PENDING_FAVORITE_ADDED_EVENT = 'dm:pending-favorite-added';

function readPendingFavorite(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(PENDING_FAVORITE_KEY);
  } catch {
    return null;
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, dbUser } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  // Product ids with a filled heart. Kept apart from `items` so a toggle shows
  // at once; the list itself catches up on the next fetch.
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  // Same sequencing and per-user guards as CartProvider's pending add.
  const fetchRef = useRef<Promise<void> | null>(null);
  const loadedUidRef = useRef<string | null>(null);
  const flushingRef = useRef(false);
  const flushedRef = useRef(false);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const favorites = await favoritesService.getFavorites(user);
      setItems(favorites);
      setIds(new Set(favorites.map((f) => f.product_id)));
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load once per signed-in user; reset everything when they sign out.
  useEffect(() => {
    if (!user) {
      loadedUidRef.current = null;
      fetchRef.current = null;
      flushedRef.current = false;
      flushingRef.current = false;
      setItems([]);
      setIds(new Set());
      return;
    }
    if (loadedUidRef.current !== user.uid) {
      loadedUidRef.current = user.uid;
      flushedRef.current = false;
      flushingRef.current = false;
      fetchRef.current = refreshFavorites();
    }
  }, [user, refreshFavorites]);

  const queueFavorite = useCallback((productId: string) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(PENDING_FAVORITE_KEY, productId);
  }, []);

  // Flush a queued favorite once the account is fully ready. Gating on `dbUser`
  // guarantees the DB row exists, so the POST won't 404 for a new registration.
  // Ref guards rather than effect cleanup, for the reasons given in CartProvider.
  useEffect(() => {
    if (!user || !dbUser) return;
    if (flushedRef.current || flushingRef.current) return;

    const pending = readPendingFavorite();
    if (!pending) return;

    flushingRef.current = true;
    (async () => {
      try {
        await fetchRef.current;
      } catch {
        /* fetch failure is handled in refreshFavorites; proceed with the add */
      }

      try {
        await favoritesService.addFavorite(user, pending);
        // Consume the intent only after the add actually succeeds.
        flushedRef.current = true;
        window.sessionStorage.removeItem(PENDING_FAVORITE_KEY);
        setIds((prev) => new Set(prev).add(pending));
        window.dispatchEvent(new CustomEvent(PENDING_FAVORITE_ADDED_EVENT));
        await refreshFavorites();
      } catch (error) {
        // Leave the intent in place so a later trigger can retry.
        console.error('Failed to save queued favorite after sign-in:', error);
      } finally {
        flushingRef.current = false;
      }
    })();
  }, [user, dbUser, refreshFavorites]);

  const isFavorite = useCallback((productId: string) => ids.has(productId), [ids]);

  const removeFavorite = useCallback(
    async (productId: string) => {
      if (!user) return;
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setItems((prev) => prev.filter((f) => f.product_id !== productId));
      try {
        await favoritesService.removeFavorite(user, productId);
      } catch (error) {
        await refreshFavorites();
        throw error;
      }
    },
    [user, refreshFavorites]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        throw new Error('User must be logged in to save favorites');
      }
      if (ids.has(productId)) {
        await removeFavorite(productId);
        return;
      }

      setIds((prev) => new Set(prev).add(productId));
      try {
        await favoritesService.addFavorite(user, productId);
      } catch (error) {
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        throw error;
      }
      // Bring the list (images, prices) up to date in the background.
      refreshFavorites();
    },
    [user, ids, removeFavorite, refreshFavorites]
  );

  const value = {
    items,
    loading,
    count: ids.size,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    queueFavorite,
    refreshFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
