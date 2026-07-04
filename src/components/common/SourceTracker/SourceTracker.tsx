'use client';

import { useEffect } from 'react';

const COOKIE = 'dm_source';
const MAX_AGE_DAYS = 60;

/**
 * Captures a ?source= query param on landing and stores it in a first-touch
 * cookie (60-day window). The registration endpoint reads this cookie and
 * attributes the new user to that acquisition source.
 *
 * Note: this only records attribution silently — visitors arriving via a source
 * link land on the normal page and are NOT prompted with the registration modal.
 */
export function SourceTracker() {
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

  return null;
}
