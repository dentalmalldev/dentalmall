'use client';

import { Box, Typography, TextField, Button, Grid, CircularProgress, Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { useState } from 'react';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { updateProfileSchema } from '@/lib/validations/auth';
import { authService } from '@/services/auth';

export function ProfileInfo() {
  const t = useTranslations('profile');
  const tv = useTranslations('validation');
  const { user, dbUser, refreshDbUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      first_name: dbUser?.first_name || '',
      last_name: dbUser?.last_name || '',
      personal_id: dbUser?.personal_id || '',
    },
    enableReinitialize: true,
    validationSchema: toFormikValidationSchema(updateProfileSchema),
    onSubmit: async (values) => {
      setError(null);
      setSuccess(null);

      if (!user) return;

      try {
        await authService.updateProfile(user, {
          first_name: values.first_name,
          last_name: values.last_name,
          personal_id: values.personal_id || undefined,
        });
        await refreshDbUser();
        setSuccess(t('profileUpdated'));
      } catch (err: any) {
        setError(err.message || tv('unknownError'));
      }
    },
  });

  const getFieldError = (field: keyof typeof formik.values) => {
    if (formik.touched[field] && formik.errors[field]) {
      const errorKey = formik.errors[field] as string;
      if (errorKey.startsWith('validation.')) {
        return tv(errorKey.replace('validation.', ''));
      }
      return errorKey;
    }
    return undefined;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        {t('myInfo')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('firstName')}
            </Typography>
            <TextField
              fullWidth
              name="first_name"
              value={formik.values.first_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.first_name && Boolean(formik.errors.first_name)}
              helperText={getFieldError('first_name')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('lastName')}
            </Typography>
            <TextField
              fullWidth
              name="last_name"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.last_name && Boolean(formik.errors.last_name)}
              helperText={getFieldError('last_name')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('userId')}
            </Typography>
            <TextField
              fullWidth
              value={dbUser?.id?.slice(-7) || ''}
              disabled
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'grey.50',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('personalId')}
            </Typography>
            <TextField
              fullWidth
              name="personal_id"
              value={formik.values.personal_id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.personal_id && Boolean(formik.errors.personal_id)}
              helperText={getFieldError('personal_id')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('email')}
            </Typography>
            <TextField
              fullWidth
              value={dbUser?.email || ''}
              disabled
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'grey.50',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={formik.isSubmitting}
              sx={{
                borderRadius: '12px',
                px: 6,
                py: 1.5,
                mt: 2,
              }}
            >
              {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('save')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
