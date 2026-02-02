'use client';

import { Paper, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import {
  UserIcon,
  LocationIcon,
  OrdersIcon,
  LockIcon,
  LogoutIcon,
  ClinicIcon,
  VendorIcon,
  ArrowRightIcon,
} from '@/icons';

export type ProfileTab = 'info' | 'addresses' | 'orders' | 'password' | 'clinic' | 'vendor';

interface ProfileSidebarProps {
  activeTab: ProfileTab | null;
  onTabChange: (tab: ProfileTab) => void;
}

export function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  const t = useTranslations('profile');
  const tc = useTranslations('clinic');
  const tv = useTranslations('vendor');
  const { logout, dbUser } = useAuth();

  const menuItems: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: t('myInfo'), icon: <UserIcon /> },
    { id: 'addresses', label: t('addresses'), icon: <LocationIcon /> },
    { id: 'orders', label: t('orders'), icon: <OrdersIcon /> },
    { id: 'password', label: t('changePassword'), icon: <LockIcon /> },
  ];

  const isClinicUser = dbUser?.role === 'CLINIC';
  const isVendorUser = (dbUser?.role as string) === 'VENDOR';
  const clinicTabLabel = isClinicUser ? tc('myClinics') : tc('becomeClinic');
  const vendorTabLabel = isVendorUser ? tv('myVendors') : tv('becomeVendor');

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Paper
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        p: 2,
        backgroundColor: '#8DA0FF1A'
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ px: 2, py: 1.5 }}>
        {t('myAccount')}
      </Typography>

      <List sx={{ p: 0 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
            sx={{
              borderRadius: '12px',
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(91, 110, 205, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(91, 110, 205, 0.15)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: activeTab === item.id ? 'primary.main' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: activeTab === item.id ? 600 : 400,
                color: activeTab === item.id ? 'primary.main' : 'text.primary',
              }}
            />
            {activeTab === item.id && (
              <Box sx={{ color: 'primary.main' }}>
                <ArrowRightIcon />
              </Box>
            )}
          </ListItemButton>
        ))}
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              selected={activeTab === 'clinic'}
              onClick={() => onTabChange('clinic')}
              sx={{
                borderRadius: '12px',
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(91, 110, 205, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(91, 110, 205, 0.15)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'clinic' ? 'primary.main' : 'text.secondary' }}>
                <ClinicIcon />
              </ListItemIcon>
              <ListItemText
                primary={clinicTabLabel}
                primaryTypographyProps={{
                  fontWeight: activeTab === 'clinic' ? 600 : 400,
                  color: activeTab === 'clinic' ? 'primary.main' : 'text.primary',
                }}
              />
              {activeTab === 'clinic' && (
                <Box sx={{ color: 'primary.main' }}>
                  <ArrowRightIcon />
                </Box>
              )}
            </ListItemButton>
            <ListItemButton
              selected={activeTab === 'vendor'}
              onClick={() => onTabChange('vendor')}
              sx={{
                borderRadius: '12px',
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(91, 110, 205, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(91, 110, 205, 0.15)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'vendor' ? 'primary.main' : 'text.secondary' }}>
                <VendorIcon />
              </ListItemIcon>
              <ListItemText
                primary={vendorTabLabel}
                primaryTypographyProps={{
                  fontWeight: activeTab === 'vendor' ? 600 : 400,
                  color: activeTab === 'vendor' ? 'primary.main' : 'text.primary',
                }}
              />
              {activeTab === 'vendor' && (
                <Box sx={{ color: 'primary.main' }}>
                  <ArrowRightIcon />
                </Box>
              )}
            </ListItemButton>
          </>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '12px',
            mt: 1,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('logout')} />
        </ListItemButton>
      </List>
    </Paper>
  );
}
