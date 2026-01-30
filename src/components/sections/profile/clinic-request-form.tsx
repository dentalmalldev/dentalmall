'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { useAuth } from '@/providers';
import { ClinicRequest, ClinicRequestStatus } from '@/types/models';
import { clinicRequestSchema, ClinicRequestFormValues } from '@/lib/validations/clinic';

export function ClinicRequestForm() {
  const t = useTranslations('clinic');
  const ta = useTranslations('admin');
  const tv = useTranslations('validation');
  const { user, dbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingRequests, setExistingRequests] = useState<ClinicRequest[]>([]);

  const formik = useFormik<ClinicRequestFormValues>({
    initialValues: {
      clinic_name: '',
      identification_number: '',
      email: dbUser?.email || '',
      description: '',
      city: '',
      address: '',
      phone_number: '',
    },
    validationSchema: toFormikValidationSchema(clinicRequestSchema),
    onSubmit: async (values, { resetForm }) => {
      if (!user) return;

      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/clinic-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to submit request');
        }

        setSuccess(true);
        fetchExistingRequests();
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    },
  });

  useEffect(() => {
    fetchExistingRequests();
  }, []);

  const fetchExistingRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/clinic-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExistingRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: keyof ClinicRequestFormValues) => {
    if (formik.touched[field] && formik.errors[field]) {
      const errorKey = formik.errors[field] as string;
      return tv(errorKey.replace('validation.', ''));
    }
    return undefined;
  };

  const getStatusColor = (status: ClinicRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: ClinicRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return ta('approved');
      case 'REJECTED':
        return ta('rejected');
      case 'PENDING':
      default:
        return ta('pending');
    }
  };

  const pendingRequest = existingRequests.find((r) => r.status === 'PENDING');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        {t('becomeClinic')}
      </Typography>

      {/* Show existing requests */}
      {existingRequests.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {existingRequests.map((request) => (
            <Alert
              key={request.id}
              severity={
                request.status === 'APPROVED'
                  ? 'success'
                  : request.status === 'REJECTED'
                  ? 'error'
                  : 'info'
              }
              sx={{ mb: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600}>
                  {request.clinic_name}
                </Typography>
                <Chip
                  label={getStatusLabel(request.status)}
                  color={getStatusColor(request.status)}
                  size="small"
                />
              </Box>
              {request.admin_notes && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {ta('adminNotes')}: {request.admin_notes}
                </Typography>
              )}
            </Alert>
          ))}
        </Box>
      )}

      {/* Show form only if no pending request */}
      {!pendingRequest && (
        <>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('requestSubmitted')}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('clinicName')} *
                </Typography>
                <TextField
                  fullWidth
                  name="clinic_name"
                  value={formik.values.clinic_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.clinic_name && Boolean(formik.errors.clinic_name)}
                  helperText={getFieldError('clinic_name')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('identificationNumber')} *
                </Typography>
                <TextField
                  fullWidth
                  name="identification_number"
                  value={formik.values.identification_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.identification_number && Boolean(formik.errors.identification_number)}
                  helperText={getFieldError('identification_number')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('email')} *
                </Typography>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={getFieldError('email')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('phoneNumber')} *
                </Typography>
                <TextField
                  fullWidth
                  name="phone_number"
                  value={formik.values.phone_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone_number && Boolean(formik.errors.phone_number)}
                  helperText={getFieldError('phone_number')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('city')} *
                </Typography>
                <TextField
                  fullWidth
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={getFieldError('city')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('address')} *
                </Typography>
                <TextField
                  fullWidth
                  name="address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={getFieldError('address')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('description')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={formik.isSubmitting}
                  sx={{
                    borderRadius: '12px',
                    px: 6,
                    py: 1.5,
                  }}
                >
                  {formik.isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    t('submitRequest')
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
}
