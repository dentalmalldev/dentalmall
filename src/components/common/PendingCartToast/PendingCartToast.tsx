'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSnackbar } from '@/providers';
import { PENDING_CART_ADDED_EVENT } from '@/providers/CartProvider';

/**
 * Shows a confirmation toast after a queued (logged-out) add-to-cart intent is
 * flushed post sign-in. Lives here — rather than in CartProvider — because the
 * SnackbarProvider is nested inside CartProvider, so the provider itself can't
 * call useSnackbar. Communication is via a window event.
 */
export function PendingCartToast() {
  const t = useTranslations('productsSection');
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const handler = () => showSnackbar(t('addedToCart'));
    window.addEventListener(PENDING_CART_ADDED_EVENT, handler);
    return () => window.removeEventListener(PENDING_CART_ADDED_EVENT, handler);
  }, [showSnackbar, t]);

  return null;
}
