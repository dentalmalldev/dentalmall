'use client';

import { Box, Typography, TextField, Button, Grid, CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { useState } from 'react';

export function ProfileInfo() {
  const t = useTranslations('profile');
  const { dbUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: dbUser?.first_name || '',
    lastName: dbUser?.last_name || '',
    personalId: dbUser?.personal_id || '',
    email: dbUser?.email || '',
    phone: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implement profile update API
      console.log('Saving profile:', formData);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        {t('myInfo')}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('firstName')}
            </Typography>
            <TextField
              fullWidth
              value={formData.firstName}
              onChange={handleChange('firstName')}
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
              value={formData.lastName}
              onChange={handleChange('lastName')}
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
              value={formData.personalId}
              onChange={handleChange('personalId')}
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
              value={formData.email}
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
              {t('phone')}
            </Typography>
            <TextField
              fullWidth
              value={formData.phone}
              onChange={handleChange('phone')}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                borderRadius: '12px',
                px: 6,
                py: 1.5,
                mt: 2,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('save')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
