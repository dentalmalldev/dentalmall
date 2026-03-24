'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { useSnackbar } from '@/providers';
import { Vendor } from '@/types/models';

interface VendorProfileProps {
  vendorId?: string;
}

export function VendorProfile({ vendorId }: VendorProfileProps) {
  const t = useTranslations('vendorDashboard');
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ['vendor', 'profile', vendorId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      const params = vendorId ? `?vendor_id=${vendorId}` : '';
      const res = await fetch(`/api/vendor/profile${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vendor profile');
      return res.json();
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('logo', file);
      if (vendorId) formData.append('vendor_id', vendorId);
      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload logo');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'profile', vendorId] });
      showSnackbar(t('logoUpdated'));
      setPreview(null);
    },
    onError: () => {
      showSnackbar(t('logoUpdateError'));
      setPreview(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    uploadMutation.mutate(file);
    e.target.value = '';
  };

  const logoSrc = preview ?? vendor?.logo ?? undefined;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {t('profile')}
      </Typography>

      <Paper sx={{ p: 4, borderRadius: '16px', maxWidth: 480 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 3 }}>
          {t('companyLogo')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={logoSrc}
              sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 36 }}
            >
              {vendor?.company_name?.[0]?.toUpperCase()}
            </Avatar>
            {uploadMutation.isPending && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  borderRadius: '50%',
                }}
              >
                <CircularProgress size={32} sx={{ color: 'white' }} />
              </Box>
            )}
          </Box>

          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              sx={{ mb: 1 }}
            >
              {vendor?.logo ? t('changeLogo') : t('uploadLogo')}
            </Button>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('logoHint')}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
