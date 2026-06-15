'use client';

import { Paper, Stack, Avatar, Box, Typography, Divider } from '@mui/material';
import {
  Store as StoreIcon,
  LocationOn,
  Home,
  Phone,
  Email,
  CalendarMonth,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';

export interface VendorInfo {
  company_name: string;
  logo: string | null;
  city: string | null;
  address: string | null;
  phone_number: string | null;
  email: string | null;
  description: string | null;
  created_at: string;
  product_count: number;
}

export function VendorInfoCard({ vendor }: { vendor: VendorInfo }) {
  const t = useTranslations('vendorDetail');
  const locale = useLocale();

  const memberSince = new Date(vendor.created_at).toLocaleDateString(
    locale === 'ka' ? 'ka-GE' : 'en-US',
    { year: 'numeric', month: 'long' }
  );

  // Only render rows for fields that actually have a value.
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (vendor.city) rows.push({ icon: <LocationOn fontSize="small" />, label: t('location'), value: vendor.city });
  if (vendor.address) rows.push({ icon: <Home fontSize="small" />, label: t('address'), value: vendor.address });
  if (vendor.phone_number) rows.push({ icon: <Phone fontSize="small" />, label: t('phone'), value: vendor.phone_number });
  if (vendor.email) rows.push({ icon: <Email fontSize="small" />, label: t('email'), value: vendor.email });

  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2.5, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar
          src={vendor.logo ?? undefined}
          variant="rounded"
          sx={{ width: 72, height: 72, bgcolor: 'primary.main', borderRadius: '16px' }}
        >
          <StoreIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {vendor.company_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('productCount', { count: vendor.product_count })}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
            <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {t('memberSince', { date: memberSince })}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {rows.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1.5}>
            {rows.map((row) => (
              <Stack key={row.label} direction="row" alignItems="flex-start" spacing={1.5}>
                <Box sx={{ color: 'primary.main', mt: 0.25 }}>{row.icon}</Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {row.label}
                  </Typography>
                  <Typography variant="body2">{row.value}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </>
      )}

      {vendor.description && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t('about')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {vendor.description}
          </Typography>
        </>
      )}
    </Paper>
  );
}
