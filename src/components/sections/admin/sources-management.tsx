'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import { ContentCopy, Download, Delete, Add, QrCode2 } from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';

interface MarketingSource {
  id: string;
  name: string;
  slug: string;
  registrations: number;
  created_at: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://dentalmall.ge');

const buildLink = (slug: string) => `${BASE_URL.replace(/\/$/, '')}?source=${slug}`;

export function SourcesManagement() {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: MarketingSource[] }>({
    queryKey: ['admin', 'sources'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/sources', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load sources');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, name }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create source');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sources'] });
      setSuccess(t('sourceCreated'));
      setSlug('');
      setName('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/sources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete source');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'sources'] }),
  });

  const sources = data?.data ?? [];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        {t('sourcesTitle')}
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

      {/* Create form */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: '12px' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          {t('createSource')}
        </Typography>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label={t('sourceCode')}
              placeholder="qr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText={t('sourceCodeHint')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth
              size="small"
              label={t('sourceNameOptional')}
              placeholder="QR — flyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={createMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Add />}
              disabled={!slug.trim() || createMutation.isPending}
              onClick={() => {
                setError(null);
                setSuccess(null);
                createMutation.mutate();
              }}
            >
              {t('createSource')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* List */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : sources.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '12px', textAlign: 'center' }}>
          <QrCode2 sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">{t('noSources')}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {sources.map((source) => (
            <Grid key={source.id} size={{ xs: 12, md: 6 }}>
              <SourceCard
                source={source}
                onDelete={() => deleteMutation.mutate(source.id)}
                deleting={deleteMutation.isPending}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function SourceCard({
  source,
  onDelete,
  deleting,
}: {
  source: MarketingSource;
  onDelete: () => void;
  deleting: boolean;
}) {
  const t = useTranslations('admin');
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const link = buildLink(source.slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${source.slug}.png`;
    a.click();
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', height: '100%' }}>
      <Stack direction="row" spacing={2}>
        <Box ref={qrRef} sx={{ flexShrink: 0 }}>
          <QRCodeCanvas value={link} size={120} marginSize={2} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {source.name}
            </Typography>
            <Tooltip title={t('deleteSource')}>
              <IconButton size="small" color="error" onClick={onDelete} disabled={deleting}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Chip label={`?source=${source.slug}`} size="small" sx={{ mt: 0.5, mb: 1 }} />

          <Typography
            variant="body2"
            sx={{ wordBreak: 'break-all', color: 'text.secondary', mb: 1 }}
          >
            {link}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" startIcon={<ContentCopy />} onClick={handleCopy}>
              {copied ? t('copied') : t('copyLink')}
            </Button>
            <Button size="small" startIcon={<Download />} onClick={handleDownload}>
              {t('downloadQr')}
            </Button>
          </Stack>

          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            {t('registrations')}:{' '}
            <Typography component="span" fontWeight={700} color="primary.main">
              {source.registrations}
            </Typography>
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
