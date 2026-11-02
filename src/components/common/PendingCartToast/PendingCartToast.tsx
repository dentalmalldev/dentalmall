'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSnackbar } from '@/providers';
import { PENDING_CART_ADDED_EVENT } from '@/providers/CartProvider';
import { PENDING_FAVORITE_ADDED_EVENT } from '@/providers/FavoritesProvider';

/**
 * Shows a confirmation toast after a queued (logged-out) add-to-cart or
 * favorite intent is flushed post sign-in. Lives here — rather than in CartProvider — because the
 * SnackbarProvider is nested inside CartProvider, so the provider itself can't
 * call useSnackbar. Communication is via a window event.
 */
export function PendingCartToast() {
  const t = useTranslations('productsSection');
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const onCart = () => showSnackbar(t('addedToCart'));
    const onFavorite = () => showSnackbar(t('addedToFavorites'));
    window.addEventListener(PENDING_CART_ADDED_EVENT, onCart);
    window.addEventListener(PENDING_FAVORITE_ADDED_EVENT, onFavorite);
    return () => {
      window.removeEventListener(PENDING_CART_ADDED_EVENT, onCart);
      window.removeEventListener(PENDING_FAVORITE_ADDED_EVENT, onFavorite);
    };
  }, [showSnackbar, t]);

  return null;
}
