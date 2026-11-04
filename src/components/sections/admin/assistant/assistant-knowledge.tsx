'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, ArrowDownward, ArrowUpward, Delete, Edit, FileDownload } from '@mui/icons-material';
import { useLocale, useTranslations } from 'next-intl';
import { colors } from '@/theme';
import type { AssistantFaqValues } from '@/lib/validations/assistant';
import { type AssistantFaq, useAssistantFaqs, useFaqMutations } from './assistant-api';

const EMPTY: AssistantFaqValues = { question_ka: '', question_en: '', answer_ka: '', answer_en: '' };

export function AssistantKnowledge() {
  const t = useTranslations('adminAssistant');
  const locale = useLocale();
  const { data: faqs, isLoading } = useAssistantFaqs();
  const { create, update, remove, importSite } = useFaqMutations();
  const [editing, setEditing] = useState<{ id: string | null; values: AssistantFaqValues } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ type: 'success', text: success });
      return true;
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
      return false;
    }
  };

  const handleImport = () =>
    run(async () => {
      const { imported, skipped } = await importSite.mutateAsync();
      setMessage({ type: 'success', text: t('imported', { imported, skipped }) });
    });

  const handleSaveDialog = async () => {
    if (!editing) return;
    const { id, values } = editing;
    const ok = await run(
      () => (id ? update.mutateAsync({ id, values }) : create.mutateAsync(values)),
      id ? t('entrySaved') : t('entryAdded')
    );
    if (ok) setEditing(null);
  };

  // Swap with the neighbour; equal orders (never set by this page) fall back to positions.
  const move = (index: number, delta: -1 | 1) => {
    if (!faqs) return;
    const a = faqs[index];
    const b = faqs[index + delta];
    if (!b) return;
    const [orderA, orderB] = a.sort_order === b.sort_order ? [index + delta, index] : [b.sort_order, a.sort_order];
    run(async () => {
      await update.mutateAsync({ id: a.id, values: { sort_order: orderA } });
      await update.mutateAsync({ id: b.id, values: { sort_order: orderB } });
    });
  };

  const handleDelete = (faq: AssistantFaq) => {
    if (!window.confirm(t('deleteEntryConfirm'))) return;
    run(() => remove.mutateAsync(faq.id), t('entryDeleted'));
  };

  const dialogValid =
    editing && Object.values(editing.values).every((v) => typeof v !== 'string' || v.trim().length > 0);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {t('knowledgeHint')}
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setEditing({ id: null, values: EMPTY })}
          sx={{ textTransform: 'none', backgroundColor: colors.accent.main, '&:hover': { backgroundColor: colors.accent.hover } }}
        >
          {t('addEntry')}
        </Button>
        <Button
          variant="outlined"
          startIcon={importSite.isPending ? <CircularProgress size={16} /> : <FileDownload />}
          onClick={handleImport}
          disabled={importSite.isPending}
          sx={{ textTransform: 'none' }}
        >
          {t('importSiteFaq')}
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !faqs || faqs.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', backgroundColor: '#f5f6fa' }}>
          <Typography color="text.secondary">{t('noEntries')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {faqs.map((faq, index) => (
            <Paper key={faq.id} variant="outlined" sx={{ p: 2, borderRadius: '12px', opacity: faq.is_active ? 1 : 0.6 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                    {locale === 'ka' ? faq.question_ka : faq.question_en}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {locale === 'ka' ? faq.answer_ka : faq.answer_en}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title={faq.is_active ? t('entryActive') : t('entryInactive')}>
                    <Switch
                      size="small"
                      checked={faq.is_active}
                      onChange={(e) => run(() => update.mutateAsync({ id: faq.id, values: { is_active: e.target.checked } }))}
                      inputProps={{ 'aria-label': t('entryActive') }}
                    />
                  </Tooltip>
                  <IconButton size="small" aria-label={t('moveUp')} disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t('moveDown')}
                    disabled={index === faqs.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t('edit')}
                    onClick={() =>
                      setEditing({
                        id: faq.id,
                        values: {
                          question_ka: faq.question_ka,
                          question_en: faq.question_en,
                          answer_ka: faq.answer_ka,
                          answer_en: faq.answer_en,
                        },
                      })
                    }
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" aria-label={t('delete')} onClick={() => handleDelete(faq)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing?.id ? t('editEntry') : t('addEntry')}</DialogTitle>
        <DialogContent dividers>
          {editing && (
            <Grid container spacing={2}>
              {(['ka', 'en'] as const).map((lang) => (
                <Grid key={lang} size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <TextField
                      label={`${t('question')} (${lang.toUpperCase()})`}
                      value={editing.values[`question_${lang}`]}
                      onChange={(e) =>
                        setEditing({ ...editing, values: { ...editing.values, [`question_${lang}`]: e.target.value } })
                      }
                      inputProps={{ maxLength: 300 }}
                      fullWidth
                    />
                    <TextField
                      label={`${t('answer')} (${lang.toUpperCase()})`}
                      value={editing.values[`answer_${lang}`]}
                      onChange={(e) =>
                        setEditing({ ...editing, values: { ...editing.values, [`answer_${lang}`]: e.target.value } })
                      }
                      inputProps={{ maxLength: 2000 }}
                      multiline
                      minRows={4}
                      fullWidth
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditing(null)} sx={{ textTransform: 'none' }}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDialog}
            disabled={!dialogValid || create.isPending || update.isPending}
            sx={{ textTransform: 'none', backgroundColor: colors.accent.main, '&:hover': { backgroundColor: colors.accent.hover } }}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
