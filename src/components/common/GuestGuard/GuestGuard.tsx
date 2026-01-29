'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/providers';

interface GuestGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function GuestGuard({
  children,
  fallback,
  redirectTo = '/',
}: GuestGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.push(redirectTo);
      setIsGuest(false);
    } else {
      setIsGuest(true);
    }
  }, [user, loading, redirectTo, router]);

  if (loading) {
    return (
      fallback || (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      )
    );
  }

  if (!isGuest) {
    return (
      fallback || (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      )
    );
  }

  return <>{children}</>;
}
