'use client';

import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Avatar,
} from '@mui/material';
import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AdminGuard } from '@/components/common';
import { Logo } from '@/icons';

export function AdminDashboardContent() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

function AdminDashboard() {
  const ta = useTranslations('admin');
  const { dbUser, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/admin/login`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f6fa',
      }}
    >
      {/* Admin Header */}
      <Paper
        elevation={0}
        sx={{
          py: 2,
          px: 4,
          borderRadius: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Logo variant="icon" width={50} height={50}/>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                {dbUser?.first_name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {dbUser?.first_name} {dbUser?.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dbUser?.email}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
              sx={{ borderRadius: '8px' }}
            >
              {ta('logout')}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Dashboard Content */}
      <Box sx={{ p: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight={600} color="primary.main" gutterBottom>
            {ta('welcome')}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {ta('loggedInAs')}: <strong>{dbUser?.email}</strong>
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: '12px',
                backgroundColor: 'primary.main',
                color: 'white',
                minWidth: 150,
              }}
            >
              <Typography variant="h3" fontWeight={700}>
                0
              </Typography>
              <Typography variant="body2">Products</Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: '12px',
                backgroundColor: '#9292FF',
                color: 'white',
                minWidth: 150,
              }}
            >
              <Typography variant="h3" fontWeight={700}>
                0
              </Typography>
              <Typography variant="body2">Orders</Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: '12px',
                backgroundColor: '#01DBE6',
                color: 'white',
                minWidth: 150,
              }}
            >
              <Typography variant="h3" fontWeight={700}>
                0
              </Typography>
              <Typography variant="body2">Users</Typography>
            </Paper>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
