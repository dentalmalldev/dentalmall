'use client';

import { Box, Grid, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AuthGuard } from '@/components/common';
import { ProfileSidebar, ProfileTab } from './profile-sidebar';
import { ProfileInfo } from './profile-info';
import { ClinicRequestForm } from './clinic-request-form';
import { MyClinics } from './my-clinics';
import { useState } from 'react';
import { LeftIcon } from '@/icons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';

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
  const { dbUser } = useAuth();

  const isClinicUser = dbUser?.role === 'CLINIC';

  // On mobile, null means showing sidebar; on desktop, default to 'info'
  const [activeTab, setActiveTab] = useState<ProfileTab | null>(isMobile ? null : 'info');

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
  };

  const handleBack = () => {
    setActiveTab(null);
  };

  const getTabTitle = (tab: ProfileTab) => {
    switch (tab) {
      case 'info': return t('myInfo');
      case 'addresses': return t('addresses');
      case 'orders': return t('orders');
      case 'password': return t('changePassword');
      case 'clinic': return isClinicUser ? tc('myClinics') : tc('becomeClinic');
    }
  };

  const renderClinicContent = () => {
    if (isClinicUser) {
      return <MyClinics />;
    }
    return <ClinicRequestForm />;
  };

  // Mobile view
  if (isMobile) {
    return (
      <Box sx={{ padding: "16px" }}>
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
            {activeTab === 'addresses' && <div>Addresses coming soon</div>}
            {activeTab === 'orders' && <div>Orders coming soon</div>}
            {activeTab === 'password' && <div>Change password coming soon</div>}
            {activeTab === 'clinic' && renderClinicContent()}
          </Box>
        )}
      </Box>
    );
  }

  // Desktop view
  return (
    <Box sx={{ padding: "28px 120px" }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 3 }}>
          <ProfileSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          {(activeTab === 'info' || activeTab === null) && <ProfileInfo />}
          {activeTab === 'addresses' && <div>Addresses coming soon</div>}
          {activeTab === 'orders' && <div>Orders coming soon</div>}
          {activeTab === 'password' && <div>Change password coming soon</div>}
          {activeTab === 'clinic' && renderClinicContent()}
        </Grid>
      </Grid>
    </Box>
  );
}
