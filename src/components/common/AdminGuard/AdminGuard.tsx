'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/providers';
import { useLocale } from 'next-intl';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    const checkAdmin = async () => {
      // Not logged in at all
      if (!user) {
        router.push(`/${locale}/admin/login`);
        return;
      }

      // Check if user is admin in database
      if (!dbUser || dbUser.role !== 'ADMIN') {
        router.push(`/${locale}/admin/login`);
        return;
      }

      // Verify with API
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthorized(true);
        } else {
          router.push(`/${locale}/admin/login`);
        }
      } catch (error) {
        console.error('Admin verification error:', error);
        router.push(`/${locale}/admin/login`);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [user, dbUser, loading, router, locale]);

  if (loading || checking) {
    return (
      fallback || (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
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
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
          }}
        >
          <CircularProgress />
        </Box>
      )
    );
  }

  return <>{children}</>;
}
