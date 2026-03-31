'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warehouse } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';

export function StorageLoginContent() {
  const t = useTranslations('storage');
  const locale = useLocale();
  const router = useRouter();
  const { login, dbUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      router.push(`/${locale}/storage`);
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbUser?.role === 'STORAGE') {
      router.push(`/${locale}/storage`);
    }
  }, [dbUser, router, locale]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8f9fa',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, borderRadius: '20px', width: '100%', maxWidth: 400 }} elevation={0}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              bgcolor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Warehouse />
          </Box>
          <Typography variant="h5" fontWeight={700}>{t('loginTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t('loginSubtitle')}
          </Typography>
        </Stack>

        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('login')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
