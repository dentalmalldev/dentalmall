'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { adminRequest, useAssistantSettings, useSaveAssistantSettings } from './assistant-api';

interface Stats {
  days: number;
  totals: {
    questions: number;
    cost_usd: number;
    avg_seconds: number | null;
    helpful: number;
    not_helpful: number;
    errors: number;
    no_products: number;
    invented: number;
  };
  daily: Array<{
    day: string;
    questions: number;
    cost_usd: number;
    avg_ms: number | null;
    helpful: number;
    not_helpful: number;
    errors: number;
    no_products: number;
  }>;
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', height: '100%' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

export function AssistantOverview() {
  const t = useTranslations('adminAssistant');
  const [days, setDays] = useState(30);
  const [retentionDays, setRetentionDays] = useState('180');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { data: config } = useAssistantSettings();
  const save = useSaveAssistantSettings();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'assistant', 'stats', days],
    queryFn: () => adminRequest<Stats>(`/api/admin/assistant/stats?days=${days}`),
  });

  const toggle = async (enabled: boolean) => {
    setMessage(null);
    try {
      await save.mutateAsync({ enabled });
      setMessage({ type: 'success', text: enabled ? t('turnedOn') : t('turnedOff') });
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    }
  };

  const deleteOld = async () => {
    const n = parseInt(retentionDays, 10);
    if (!Number.isInteger(n) || n < 1) return;
    if (!window.confirm(t('retentionConfirm', { days: n }))) return;
    setMessage(null);
    try {
      const { deleted } = await adminRequest<{ deleted: number }>(
        `/api/admin/assistant/logs?older_than_days=${n}`,
        { method: 'DELETE' }
      );
      setMessage({ type: 'success', text: t('retentionDone', { count: deleted }) });
      refetch();
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    }
  };

  const totals = stats?.totals;
  const rated = totals ? totals.helpful + totals.not_helpful : 0;

  return (
    <Stack spacing={3}>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Status */}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                {t('statusTitle')}
              </Typography>
              {config && (
                <Chip
                  size="small"
                  color={config.effective.enabled ? 'success' : 'default'}
                  label={config.effective.enabled ? t('live') : t('off')}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t('statusHint')}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            {save.isPending && <CircularProgress size={18} />}
            <Switch
              checked={config?.settings.enabled ?? false}
              disabled={!config || save.isPending}
              onChange={(e) => toggle(e.target.checked)}
              inputProps={{ 'aria-label': t('statusTitle') }}
            />
          </Stack>
        </Stack>
        {config && !config.env.has_api_key && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('noApiKey')}
          </Alert>
        )}
        {config?.env.env_disabled && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('envDisabled')}
          </Alert>
        )}
      </Paper>

      {/* Usage */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
        <Typography variant="h6" fontWeight={600}>
          {t('usageTitle')}
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)}>
          {[7, 30, 90].map((d) => (
            <ToggleButton key={d} value={d} sx={{ textTransform: 'none' }}>
              {t('lastDays', { days: d })}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {isLoading || !totals ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Tile label={t('questions')} value={String(totals.questions)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Tile label={t('cost')} value={`$${totals.cost_usd.toFixed(3)}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Tile
                label={t('avgTime')}
                value={totals.avg_seconds === null ? '—' : t('seconds', { value: totals.avg_seconds.toFixed(1) })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Tile
                label={t('helpfulRate')}
                value={rated ? `${Math.round((totals.helpful / rated) * 100)}%` : '—'}
                hint={t('ratedCount', { up: totals.helpful, down: totals.not_helpful })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <Tile label={t('noProducts')} value={String(totals.no_products)} hint={t('noProductsHint')} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <Tile label={t('errors')} value={String(totals.errors)} hint={t('errorsHint')} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Tile label={t('invented')} value={String(totals.invented)} hint={t('inventedHint')} />
            </Grid>
          </Grid>

          {stats.daily.length === 0 ? (
            <Typography color="text.secondary">{t('noUsage')}</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('day')}</TableCell>
                    <TableCell align="right">{t('questions')}</TableCell>
                    <TableCell align="right">{t('cost')}</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {t('avgTime')}
                    </TableCell>
                    <TableCell align="right">👍 / 👎</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {t('noProducts')}
                    </TableCell>
                    <TableCell align="right">{t('errors')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.daily.map((d) => (
                    <TableRow key={d.day}>
                      <TableCell>{d.day}</TableCell>
                      <TableCell align="right">{d.questions}</TableCell>
                      <TableCell align="right">${d.cost_usd.toFixed(3)}</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {d.avg_ms === null ? '—' : t('seconds', { value: (d.avg_ms / 1000).toFixed(1) })}
                      </TableCell>
                      <TableCell align="right">
                        {d.helpful} / {d.not_helpful}
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {d.no_products}
                      </TableCell>
                      <TableCell align="right">{d.errors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Retention */}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px' }}>
        <Typography variant="h6" fontWeight={600}>
          {t('retentionTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('retentionHint')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small"
            type="number"
            label={t('retentionDays')}
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ width: { sm: 200 } }}
          />
          <Button variant="outlined" color="error" onClick={deleteOld} sx={{ textTransform: 'none' }}>
            {t('retentionDelete')}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
