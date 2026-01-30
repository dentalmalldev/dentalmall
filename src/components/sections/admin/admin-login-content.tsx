'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { loginSchema, LoginFormValues } from '@/lib/validations/auth';
import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FirebaseError } from 'firebase/app';
import { Logo } from '@/icons';

export function AdminLoginContent() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const ta = useTranslations('admin');
  const { login, user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      remember: false,
    },
    validationSchema: toFormikValidationSchema(loginSchema),
    onSubmit: async (values) => {
      setError(null);
      try {
        // First, login with Firebase
        const loggedInUser = await login({ email: values.email, password: values.password });

        // Then verify admin status
        setVerifying(true);
        const token = await loggedInUser.getIdToken();

        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || ta('accessDenied'));
          return;
        }

        // Redirect to admin dashboard
        router.push(`/${locale}/admin`);
      } catch (err) {
        if (err instanceof FirebaseError) {
          switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              setError(tv('invalidCredentials'));
              break;
            case 'auth/too-many-requests':
              setError(tv('tooManyRequests'));
              break;
            default:
              setError(tv('unknownError'));
          }
        } else {
          setError(tv('unknownError'));
        }
      } finally {
        setVerifying(false);
      }
    },
  });

  const getFieldError = (field: keyof LoginFormValues) => {
    if (formik.touched[field] && formik.errors[field]) {
      const errorKey = formik.errors[field] as string;
      return tv(errorKey.replace('validation.', ''));
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f6fa',
        padding: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          padding: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Logo variant="icon" />

          <Typography variant="h5" fontWeight={600} color="text.primary">
            {ta('loginTitle')}
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            {ta('loginSubtitle')}
          </Typography>
        </Stack>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 4 }}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              placeholder={t('fillIn') + ' ' + t('email')}
              label={t('email')}
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={getFieldError('email')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <TextField
              fullWidth
              placeholder={t('fillIn') + ' ' + t('password')}
              label={t('password')}
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={getFieldError('password')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={formik.isSubmitting || verifying}
              sx={{
                borderRadius: '12px',
                py: 1.5,
              }}
            >
              {formik.isSubmitting || verifying ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                ta('login')
              )}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
