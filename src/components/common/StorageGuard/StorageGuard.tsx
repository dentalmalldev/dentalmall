'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/providers';
import { useLocale } from 'next-intl';

interface StorageGuardProps {
  children: React.ReactNode;
}

export function StorageGuard({ children }: StorageGuardProps) {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user || !dbUser || dbUser.role !== 'STORAGE') {
      router.push(`/${locale}/storage/login`);
      return;
    }

    setIsAuthorized(true);
  }, [user, dbUser, loading, router, locale]);

  if (loading || !isAuthorized) {
    return (
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
    );
  }

  return <>{children}</>;
}
