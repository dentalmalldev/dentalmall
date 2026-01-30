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
import { Clinic } from '@/types/models';
import { ClinicRequestForm } from './clinic-request-form';

export function MyClinics() {
  const t = useTranslations('clinic');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/clinics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
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
          {t('myClinics')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setShowAddForm(!showAddForm)}
          sx={{ borderRadius: '12px' }}
        >
          {showAddForm ? t('hideForm') : t('addNewClinic')}
        </Button>
      </Stack>

      {/* Add New Clinic Form */}
      <Collapse in={showAddForm}>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            backgroundColor: '#f5f6fa',
          }}
        >
          <ClinicRequestForm />
        </Paper>
      </Collapse>

      {/* Clinics List */}
      {clinics.length === 0 ? (
        <Typography color="text.secondary">{t('noClinics')}</Typography>
      ) : (
        <Stack spacing={2}>
          {clinics.map((clinic) => (
            <Paper
              key={clinic.id}
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
                      {clinic.clinic_name}
                    </Typography>
                    <Chip
                      label={clinic.is_active ? t('active') : t('inactive')}
                      color={clinic.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('identificationNumber')}: {clinic.identification_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('email')}: {clinic.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('phoneNumber')}: {clinic.phone_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('address')}: {clinic.address}, {clinic.city}
                  </Typography>
                  {clinic.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {clinic.description}
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
