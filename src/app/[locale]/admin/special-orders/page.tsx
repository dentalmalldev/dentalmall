import { SpecialOrdersManagement } from '@/components/sections/admin';
import { Box, Paper } from '@mui/material';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('admin');
  return {
    title: `${t('specialOrders')} | Admin - DentalMall`,
  };
}

export default function SpecialOrdersPage() {
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <SpecialOrdersManagement />
      </Paper>
    </Box>
  );
}
