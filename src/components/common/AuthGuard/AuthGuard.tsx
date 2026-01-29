'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/providers';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireDbUser?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = '/',
  requireDbUser = false,
}: AuthGuardProps) {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isAuthenticated = requireDbUser ? !!user && !!dbUser : !!user;

    if (!isAuthenticated) {
      if (redirectTo) {
        router.push(redirectTo);
      }
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [user, dbUser, loading, redirectTo, requireDbUser, router]);

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

  if (!isAuthorized) {
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
