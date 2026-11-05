'use client';

import { useState } from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { GoogleIcon } from '@/icons/google/google';
import { firebaseAuthErrorKey } from '@/lib/firebase-auth-errors';
import { useAuth } from '@/providers';
import { BackOfficeAccessDeniedError, BackOfficeRole } from '@/services/auth';
import OrDivider from './or-divider';

interface BackOfficeGoogleLoginProps {
  role: BackOfficeRole;
  redirectTo: string;
}

/** Google sign-in for a back-office login page. It lets existing users of that role in and creates nothing. */
export function BackOfficeGoogleLogin({ role, redirectTo }: BackOfficeGoogleLoginProps) {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const { loginWithGoogleForRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogleForRole(role);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof BackOfficeAccessDeniedError ? t('accessDenied') : tv(firebaseAuthErrorKey(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      <OrDivider />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
        onClick={handleClick}
        disabled={loading}
        sx={{ borderColor: '#D9D9D9' }}
      >
        {t('continueWithGoogle')}
      </Button>
    </Stack>
  );
}
