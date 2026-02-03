'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add, LocationOn } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { Address } from '@/types/models';


interface AddressStepProps {
  selectedAddressId: string;
  onSelect: (addressId: string, address: Address) => void;
  onNext: () => void;
}

export function AddressStep({ selectedAddressId, onSelect, onNext }: AddressStepProps) {
  const t = useTranslations('checkout');
  const ta = useTranslations('addresses');
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ city: '', address: '' });

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch addresses');
      return res.json();
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: { city: string; address: string }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add address');
      return res.json();
    },
    onSuccess: (newAddr) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddForm(false);
      setNewAddress({ city: '', address: '' });
      onSelect(newAddr.id, newAddr);
    },
  });

  const handleAddAddress = () => {
    if (newAddress.city.trim() && newAddress.address.trim()) {
      addAddressMutation.mutate(newAddress);
    }
  };

  const handleAddressChange = (addressId: string) => {
    const address = addresses.find((a) => a.id === addressId);
    if (address) {
      onSelect(addressId, address);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {t('selectAddress')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('selectAddressDescription')}
      </Typography>

      {addresses.length > 0 ? (
        <RadioGroup
          value={selectedAddressId}
          onChange={(e) => handleAddressChange(e.target.value)}
        >
          <Stack spacing={2}>
            {addresses.map((address) => (
              <Paper
                key={address.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  borderColor: selectedAddressId === address.id ? 'primary.main' : 'divider',
                  borderWidth: selectedAddressId === address.id ? 2 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => handleAddressChange(address.id)}
              >
                <FormControlLabel
                  value={address.id}
                  control={<Radio />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Box>
                        <Typography fontWeight={500}>
                          {address.city}
                          {address.is_default && (
                            <Chip
                              label={ta('default')}
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {address.address}
                        </Typography>
                      </Box>
                    </Stack>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            ))}
          </Stack>
        </RadioGroup>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: '12px',
            textAlign: 'center',
            borderStyle: 'dashed',
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            {t('noAddresses')}
          </Typography>
        </Paper>
      )}

      {/* Add New Address Section */}
      <Box sx={{ mt: 3 }}>
        {!showAddForm ? (
          <Button
            startIcon={<Add />}
            onClick={() => setShowAddForm(true)}
            sx={{ textTransform: 'none' }}
          >
            {ta('addNewAddress')}
          </Button>
        ) : (
          <Paper
            variant="outlined"
            sx={{ p: 3, borderRadius: '12px', mt: 2 }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {ta('addNewAddress')}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label={ta('city')}
                value={newAddress.city}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                fullWidth
                size="small"
              />
              <TextField
                label={ta('address')}
                value={newAddress.address}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAddress({ city: '', address: '' });
                  }}
                >
                  {ta('cancel')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddAddress}
                  disabled={
                    !newAddress.city.trim() ||
                    !newAddress.address.trim() ||
                    addAddressMutation.isPending
                  }
                >
                  {addAddressMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    ta('add')
                  )}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={onNext}
          disabled={!selectedAddressId}
        >
          {t('continue')}
        </Button>
      </Stack>
    </Box>
  );
}
