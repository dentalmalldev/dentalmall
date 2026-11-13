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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  MenuItem,
} from '@mui/material';
import { ContentCopy, Download, Delete, Add, QrCode2, PeopleOutline } from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { UserEditModal } from './user-edit-modal';

/** Page a source's link opens (marketing_sources.destination). */
type SourceDestination = 'HOME' | 'REGISTER';

interface MarketingSource {
  id: string;
  name: string;
  slug: string;
  destination: SourceDestination;
  registrations: number;
  created_at: string;
}

/** A user who registered through a source (GET /api/admin/sources/[id]/users). */
interface SourceUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  _count: { orders: number };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://dentalmall.ge');

// No locale prefix: the middleware redirects to /ka and keeps the query.
// REGISTER opens the login page on its Registration tab.
const buildLink = (slug: string, destination: SourceDestination) => {
  const base = BASE_URL.replace(/\/$/, '');
  return destination === 'REGISTER'
    ? `${base}/login?tab=register&source=${slug}`
    : `${base}?source=${slug}`;
};

export function SourcesManagement() {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [destination, setDestination] = useState<SourceDestination>('HOME');
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
        body: JSON.stringify({ slug, name, destination }),
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
      setDestination('HOME');
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
          <Grid size={{ xs: 12, sm: 3 }}>
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
          <Grid size={{ xs: 12, sm: 3 }}>
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
            <TextField
              select
              fullWidth
              size="small"
              label={t('sourceDestination')}
              value={destination}
              onChange={(e) => setDestination(e.target.value as SourceDestination)}
            >
              <MenuItem value="HOME">{t('sourceDestinationHome')}</MenuItem>
              <MenuItem value="REGISTER">{t('sourceDestinationRegister')}</MenuItem>
            </TextField>
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
  const [usersOpen, setUsersOpen] = useState(false);
  const link = buildLink(source.slug, source.destination);

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

          <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 1 }}>
            <Chip label={`?source=${source.slug}`} size="small" />
            <Chip
              label={t(source.destination === 'REGISTER' ? 'sourceDestinationRegister' : 'sourceDestinationHome')}
              size="small"
              variant="outlined"
            />
          </Stack>

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
          <Button
            size="small"
            variant="outlined"
            startIcon={<PeopleOutline />}
            onClick={() => setUsersOpen(true)}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            {t('viewSourceUsers')}
          </Button>
        </Box>
      </Stack>
      <SourceUsersDialog source={source} open={usersOpen} onClose={() => setUsersOpen(false)} />
    </Paper>
  );
}

/**
 * Who registered through one QR code / link, newest first. Fetched fresh each
 * time it opens. A row opens that user's admin modal.
 */
function SourceUsersDialog({
  source,
  open,
  onClose,
}: {
  source: MarketingSource;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: SourceUser[]; total: number }>({
    queryKey: ['admin', 'sources', source.id, 'users'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/sources/${source.id}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
    enabled: open,
    staleTime: 0,
  });

  const users = data?.data ?? [];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('sourceUsersTitle', { name: source.name })}
          {data && (
            <Typography variant="body2" color="text.secondary">
              {t('sourceUsersTotal', { count: data.total })}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error">{t('actionFailed')}</Alert>
          ) : users.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              {t('sourceUsersEmpty')}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('fullName')}</TableCell>
                    <TableCell>{t('emailLabel')}</TableCell>
                    <TableCell>{t('phone')}</TableCell>
                    <TableCell>{t('registrationDate')}</TableCell>
                    <TableCell align="right">{t('totalOrders')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover onClick={() => setEditUserId(u.id)} sx={{ cursor: 'pointer' }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {u.first_name} {u.last_name}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{u.email}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.phone_number || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(u.created_at).toLocaleDateString('ka-GE')}
                      </TableCell>
                      <TableCell align="right">{u._count.orders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('sourceUsersClose')}</Button>
        </DialogActions>
      </Dialog>

      <UserEditModal
        userId={editUserId}
        onClose={() => setEditUserId(null)}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'sources', source.id, 'users'] })}
      />
    </>
  );
}
