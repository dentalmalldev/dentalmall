'use client';

import { useEffect, useRef } from 'react';
import { useAuth, useAuthModal } from '@/providers';

const COOKIE = 'dm_source';
const MAX_AGE_DAYS = 60;

/**
 * Captures a ?source= query param on landing and stores it in a first-touch
 * cookie (60-day window). The registration endpoint reads this cookie and
 * attributes the new user to that acquisition source.
 *
 * For visitors who arrive via a source link and aren't logged in, it also opens
 * the registration modal — these are acquisition links meant to drive sign-ups.
 */
export function SourceTracker() {
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const promptedRef = useRef(false);

  // Capture the attribution cookie (once on mount).
  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get('source');
    const value = source?.trim().slice(0, 100);
    if (!value) return;

    // First-touch: don't overwrite an existing attribution.
    const alreadySet = document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=`));
    if (alreadySet) return;

    document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${
      60 * 60 * 24 * MAX_AGE_DAYS
    }; SameSite=Lax`;
  }, []);

  // Auto-open the registration modal for logged-out visitors on a source link.
  useEffect(() => {
    if (promptedRef.current || loading || user) return;
    const source = new URLSearchParams(window.location.search).get('source');
    if (!source?.trim()) return;
    promptedRef.current = true;
    openAuthModal('register');
  }, [loading, user, openAuthModal]);

  return null;
}
