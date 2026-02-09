'use client';

import { useState, useEffect } from 'react';
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
  Stack,
  Button,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  ShoppingCart as OrdersIcon,
  Menu as MenuIcon,
  ChevronLeft,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { VendorGuard } from '@/components/common';
import { Logo } from '@/icons';
import { Vendor } from '@/types/models';

const DRAWER_WIDTH = 260;

interface VendorDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: number;
  onTabChange: (tab: number) => void;
  vendors: Vendor[];
  selectedVendorId: string;
  onVendorChange: (vendorId: string) => void;
}

export function VendorDashboardLayout({
  children,
  activeTab,
  onTabChange,
  vendors,
  selectedVendorId,
  onVendorChange,
}: VendorDashboardLayoutProps) {
  const t = useTranslations('vendorDashboard');
  const { dbUser, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: t('overview'), icon: <Dashboard />, tab: 0 },
    { label: t('products'), icon: <Inventory />, tab: 1 },
    { label: t('orders'), icon: <OrdersIcon />, tab: 2 },
  ];

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  const handleNavigation = (tab: number) => {
    onTabChange(tab);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleVendorChange = (event: SelectChangeEvent<string>) => {
    onVendorChange(event.target.value);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Logo variant="icon" width={40} height={40} />
        <Typography variant="body1" fontWeight={700} color="primary.main">
          {t('title')}
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Vendor Selector */}
      {vendors.length > 1 && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            {t('selectVendor')}
          </Typography>
          <Select
            value={selectedVendorId}
            onChange={handleVendorChange}
            size="small"
            fullWidth
            sx={{
              borderRadius: '8px',
              '& .MuiSelect-select': { fontSize: '0.875rem' },
            }}
          >
            <MenuItem value="all">{t('allVendors')}</MenuItem>
            {vendors.map((vendor) => (
              <MenuItem key={vendor.id} value={vendor.id}>
                {vendor.company_name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.tab} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.tab)}
              sx={{
                borderRadius: '10px',
                bgcolor: activeTab === item.tab ? 'primary.main' : 'transparent',
                color: activeTab === item.tab ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: activeTab === item.tab ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: activeTab === item.tab ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: activeTab === item.tab ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Back to Profile */}
      <Box sx={{ px: 2, py: 1 }}>
        <Button
          fullWidth
          startIcon={<ArrowBack />}
          onClick={() => router.push(`/${locale}/profile`)}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            justifyContent: 'flex-start',
            color: 'text.secondary',
          }}
        >
          {t('backToProfile')}
        </Button>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
            {dbUser?.first_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {dbUser?.first_name} {dbUser?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {dbUser?.email}
            </Typography>
          </Box>
        </Stack>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          onClick={handleLogout}
          sx={{ borderRadius: '8px' }}
        >
          {t('logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            bgcolor: 'white',
            boxShadow: 2,
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Sidebar - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 8, md: 4 },
          maxWidth: '100%',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
