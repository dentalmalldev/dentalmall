'use client';

import { useEffect } from 'react';

const COOKIE = 'dm_source';
const MAX_AGE_DAYS = 60;

/**
 * Captures a ?source= query param on landing and stores it in a last-touch
 * cookie (60-day window). The registration endpoint reads this cookie and
 * attributes the new user to that acquisition source.
 *
 * Last-touch: every visit with a non-empty ?source= replaces the cookie and
 * restarts its 60 days, so a user is credited to the last source link opened in
 * that browser. A visit without ?source= (or with an empty one) leaves the
 * cookie as it is.
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

    document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${
      60 * 60 * 24 * MAX_AGE_DAYS
    }; SameSite=Lax`;
  }, []);

  return null;
}
