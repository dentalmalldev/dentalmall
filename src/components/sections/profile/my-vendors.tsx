'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Button,
  Collapse,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { Vendor } from '@/types/models';
import { VendorRequestForm } from './vendor-request-form';

export function MyVendors() {
  const t = useTranslations('vendor');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/vendors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          {t('myVendors')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setShowAddForm(!showAddForm)}
          sx={{ borderRadius: '12px' }}
        >
          {showAddForm ? t('hideForm') : t('addNewVendor')}
        </Button>
      </Stack>

      {/* Add New Vendor Form */}
      <Collapse in={showAddForm}>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            backgroundColor: '#f5f6fa',
          }}
        >
          <VendorRequestForm />
        </Paper>
      </Collapse>

      {/* Vendors List */}
      {vendors.length === 0 ? (
        <Typography color="text.secondary">{t('noVendors')}</Typography>
      ) : (
        <Stack spacing={2}>
          {vendors.map((vendor) => (
            <Paper
              key={vendor.id}
              sx={{
                p: 3,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {vendor.company_name}
                    </Typography>
                    <Chip
                      label={vendor.is_active ? t('active') : t('inactive')}
                      color={vendor.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('identificationNumber')}: {vendor.identification_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('email')}: {vendor.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('phoneNumber')}: {vendor.phone_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('address')}: {vendor.address}, {vendor.city}
                  </Typography>
                  {vendor.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {vendor.description}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
