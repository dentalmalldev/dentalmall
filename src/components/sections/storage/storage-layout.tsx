'use client';

import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  LocalShipping,
  CheckCircle,
  Logout,
  Menu as MenuIcon,
  Warehouse,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers';
import { StorageGuard } from '@/components/common';

const DRAWER_WIDTH = 260;

export function StorageLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('storage');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { dbUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Skip guard on login page
  if (pathname.includes('/storage/login')) {
    return <>{children}</>;
  }

  const navItems = [
    { label: t('dashboard'), icon: <Dashboard />, path: `/${locale}/storage` },
    { label: t('toPrepare'), icon: <Inventory />, path: `/${locale}/storage/orders?tab=to_prepare` },
    { label: t('readyForDelivery'), icon: <LocalShipping />, path: `/${locale}/storage/orders?tab=ready` },
    { label: t('outForDelivery'), icon: <LocalShipping />, path: `/${locale}/storage/orders?tab=out` },
    { label: t('delivered'), icon: <CheckCircle />, path: `/${locale}/storage/orders?tab=delivered` },
  ];

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/storage/login`);
  };

  const isActive = (path: string) => {
    const [basePath, query] = path.split('?');
    if (pathname !== basePath) return false;
    if (!query) return !searchParams.toString();
    return query.split('&').every((param) => {
      const [key, value] = param.split('=');
      return searchParams.get(key) === value;
    });
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Warehouse sx={{ color: '#f59e0b', fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>
            DentalMall
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('portalTitle')}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 1, px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={isActive(item.path)}
              sx={{
                borderRadius: '10px',
                '&.Mui-selected': {
                  bgcolor: '#f59e0b',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { bgcolor: '#d97706' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#f59e0b', fontSize: 14 }}>
            {dbUser?.first_name?.[0]}{dbUser?.last_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {dbUser?.first_name} {dbUser?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {dbUser?.email}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: '10px', color: 'error.main', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('logout')} primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <StorageGuard>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                border: 'none',
                boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawerContent}
          </Drawer>
        )}

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {isMobile && (
            <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Toolbar>
                <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                  <MenuIcon />
                </IconButton>
                <Warehouse sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  {t('portalTitle')}
                </Typography>
              </Toolbar>
            </AppBar>
          )}
          <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
            {children}
          </Box>
        </Box>
      </Box>
    </StorageGuard>
  );
}
