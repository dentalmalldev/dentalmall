'use client';

import { Box, Grid, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AuthGuard } from '@/components/common';
import { ProfileSidebar, ProfileTab } from './profile-sidebar';
import { ProfileInfo } from './profile-info';
import { ClinicRequestForm } from './clinic-request-form';
import { MyClinics } from './my-clinics';
import { VendorRequestForm } from './vendor-request-form';
import { MyVendors } from './my-vendors';
import { AddressesManagement } from './addresses-management';
import { MyOrders } from './my-orders';
import { ChangePassword } from './change-password';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LeftIcon } from '@/icons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';

const VALID_TABS: ProfileTab[] = ['info', 'addresses', 'orders', 'password', 'clinic', 'vendor'];

export function ProfileContent() {
  return (
    <AuthGuard requireDbUser={true}>
      <ProfileDetails />
    </AuthGuard>
  );
}

function ProfileDetails() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const t = useTranslations('profile');
  const tc = useTranslations('clinic');
  const tv = useTranslations('vendor');
  const { dbUser } = useAuth();

  const isClinicUser = dbUser?.role === 'CLINIC';
  const isVendorUser = dbUser?.role === 'VENDOR';

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The active tab is driven by the ?tab= query param so it survives a reload.
  // No param → sidebar on mobile, "info" on desktop.
  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const activeTab: ProfileTab | null =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : isMobile ? null : 'info';

  const handleTabChange = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tab');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const getTabTitle = (tab: ProfileTab) => {
    switch (tab) {
      case 'info': return t('myInfo');
      case 'addresses': return t('addresses');
      case 'orders': return t('orders');
      case 'password': return t('changePassword');
      case 'clinic': return isClinicUser ? tc('myClinics') : tc('becomeClinic');
      case 'vendor': return isVendorUser ? tv('myVendors') : tv('becomeVendor');
    }
  };

  const renderClinicContent = () => {
    if (isClinicUser) {
      return <MyClinics />;
    }
    return <ClinicRequestForm />;
  };

  const renderVendorContent = () => {
    if (isVendorUser) {
      return <MyVendors />;
    }
    return <VendorRequestForm />;
  };

  // Mobile view
  if (isMobile) {
    return (
      <Box sx={{ py: 2 }}>
        {activeTab === null ? (
          // Show sidebar on mobile when no tab selected
          <ProfileSidebar activeTab={null} onTabChange={handleTabChange} />
        ) : (
          // Show content with back button
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <IconButton onClick={handleBack} sx={{ p: 0.5 }}>
                <LeftIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={600}>
                {getTabTitle(activeTab)}
              </Typography>
            </Stack>

            {activeTab === 'info' && <ProfileInfo />}
            {activeTab === 'addresses' && <AddressesManagement />}
            {activeTab === 'orders' && <MyOrders />}
            {activeTab === 'password' && <ChangePassword />}
            {activeTab === 'clinic' && renderClinicContent()}
            {activeTab === 'vendor' && renderVendorContent()}
          </Box>
        )}
      </Box>
    );
  }

  // Desktop view
  return (
    <Box sx={{ py: 3.5 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 3 }}>
          <ProfileSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          {(activeTab === 'info' || activeTab === null) && <ProfileInfo />}
          {activeTab === 'addresses' && <AddressesManagement />}
          {activeTab === 'orders' && <MyOrders />}
          {activeTab === 'password' && <ChangePassword />}
          {activeTab === 'clinic' && renderClinicContent()}
          {activeTab === 'vendor' && renderVendorContent()}
        </Grid>
      </Grid>
    </Box>
  );
}
