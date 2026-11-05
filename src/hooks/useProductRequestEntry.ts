'use client';

import { useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthModal } from '@/providers';

const PRODUCT_REQUEST_PATH = '/product-request';

/**
 * The way into the product request page. Logged-out visitors sign in first: in
 * the auth modal on desktop, on the login page on mobile. Either way they land
 * on the request page afterwards.
 */
export function useProductRequestEntry() {
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  const requestPage = `/${locale}${PRODUCT_REQUEST_PATH}`;

  const promptLogin = useCallback(
    ({ replace = false }: { replace?: boolean } = {}) => {
      if (!isMobile) {
        openAuthModal('login', { redirectTo: requestPage });
        return;
      }

      const loginPage = `/${locale}/login?next=${encodeURIComponent(PRODUCT_REQUEST_PATH)}`;
      if (replace) {
        router.replace(loginPage);
      } else {
        router.push(loginPage);
      }
    },
    [isMobile, locale, openAuthModal, requestPage, router]
  );

  const openRequestPage = useCallback(() => {
    // While auth is still resolving we can't tell yet, so the page itself decides.
    if (user || loading) {
      router.push(requestPage);
    } else {
      promptLogin();
    }
  }, [loading, promptLogin, requestPage, router, user]);

  return { openRequestPage, promptLogin };
}
