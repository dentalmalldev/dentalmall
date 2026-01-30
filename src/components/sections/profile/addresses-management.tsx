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
  TextField,
  Grid,
  IconButton,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { useAuth } from '@/providers';
import { Address } from '@/types/models';
import { addressSchema, AddressFormValues } from '@/lib/validations/address';

export function AddressesManagement() {
  const t = useTranslations('addresses');
  const tv = useTranslations('validation');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik<AddressFormValues>({
    initialValues: {
      city: '',
      address: '',
      is_default: false,
    },
    validationSchema: toFormikValidationSchema(addressSchema),
    onSubmit: async (values, { resetForm }) => {
      if (!user) return;

      setError(null);
      setSuccess(null);

      try {
        const token = await user.getIdToken();
        const isEditing = editingId !== null;
        const url = isEditing ? `/api/addresses/${editingId}` : '/api/addresses';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save address');
        }

        setSuccess(isEditing ? t('addressUpdated') : t('addressAdded'));
        resetForm();
        setShowAddForm(false);
        setEditingId(null);
        fetchAddresses();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    },
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    formik.setValues({
      city: address.city,
      address: address.address,
      is_default: address.is_default,
    });
    setShowAddForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    setError(null);
    setSuccess(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete address');
      }

      setSuccess(t('addressDeleted'));
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    const address = addresses.find((a) => a.id === id);
    if (!address) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          city: address.city,
          address: address.address,
          is_default: true,
        }),
      });

      if (response.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    formik.resetForm();
  };

  const getFieldError = (field: keyof AddressFormValues) => {
    if (formik.touched[field] && formik.errors[field]) {
      const errorKey = formik.errors[field] as string;
      // Check if it's a translation key or a raw error message
      if (errorKey.startsWith('validation.')) {
        return tv(errorKey.replace('validation.', ''));
      }
      // Return raw error if it's not a translation key
      return errorKey;
    }
    return undefined;
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
          {t('title')}
        </Typography>
        {!showAddForm && (
          <Button
            variant="contained"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              formik.resetForm();
            }}
            sx={{ borderRadius: '12px' }}
          >
            {t('addAddress')}
          </Button>
        )}
      </Stack>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add/Edit Address Form */}
      <Collapse in={showAddForm}>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            backgroundColor: '#f5f6fa',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            {editingId ? t('editAddress') : t('addNewAddress')}
          </Typography>

          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
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
                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting}
                    sx={{
                      borderRadius: '12px',
                      px: 4,
                    }}
                  >
                    {formik.isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : editingId ? (
                      t('save')
                    ) : (
                      t('add')
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    sx={{ borderRadius: '12px' }}
                  >
                    {t('cancel')}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Collapse>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Typography color="text.secondary">{t('noAddresses')}</Typography>
      ) : (
        <Stack spacing={2}>
          {addresses.map((address) => (
            <Paper
              key={address.id}
              sx={{
                p: 3,
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: address.is_default ? '2px solid' : 'none',
                borderColor: 'primary.main',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {address.city}
                    </Typography>
                    {address.is_default && (
                      <Chip
                        label={t('default')}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Stack>
                  <Typography variant="body1" color="text.secondary">
                    {address.address}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {!address.is_default && (
                    <Button
                      size="small"
                      onClick={() => handleSetDefault(address.id)}
                      sx={{ borderRadius: '8px' }}
                    >
                      {t('setAsDefault')}
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleEdit(address)}
                    sx={{ borderRadius: '8px' }}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(address.id)}
                    sx={{ borderRadius: '8px' }}
                  >
                    {t('delete')}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
