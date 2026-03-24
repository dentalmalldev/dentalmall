'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, TextField, Button, CircularProgress, Alert,
  Paper, Select, MenuItem, FormControl, InputLabel, Divider, Chip,
} from '@mui/material';
import { Send, History } from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';

interface EmailLog {
  id: string;
  details: string | null;
  created_at: string;
}

const TEMPLATES = [
  { id: 'custom', label: 'Custom', subject: '', body: '' },
  {
    id: 'welcome',
    label: 'Welcome',
    subject: 'Welcome to DentalMall!',
    body: 'Dear Customer,\n\nWelcome to DentalMall — Georgia\'s leading dental products marketplace.\n\nWe\'re happy to have you on board. Browse thousands of dental products from trusted vendors.\n\nBest regards,\nDentalMall Team',
  },
  {
    id: 'account_issue',
    label: 'Account Issue',
    subject: 'Important notice regarding your DentalMall account',
    body: 'Dear Customer,\n\nWe noticed an issue with your account that requires your attention.\n\nPlease log in to your account and review your details. If you have any questions, don\'t hesitate to contact our support team.\n\nBest regards,\nDentalMall Support',
  },
  {
    id: 'promo',
    label: 'Promotion',
    subject: 'Special offer just for you — DentalMall',
    body: 'Dear Customer,\n\nWe have an exclusive offer waiting for you! Visit DentalMall today and discover our latest promotions on dental equipment and supplies.\n\nDon\'t miss out — limited time offer.\n\nBest regards,\nDentalMall Team',
  },
];

export function UserTabEmail({ userId, userEmail }: { userId: string; userEmail: string }) {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('custom');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await globalThis.fetch(`/api/admin/users/${userId}/send-email`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(await res.json());
    } catch { /* non-critical */ }
  }, [user, userId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const applyTemplate = (id: string) => {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl) { setSubject(tpl.subject); setBody(tpl.body); setTemplateId(id); }
  };

  const handleSend = async () => {
    if (!user || !subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await globalThis.fetch(`/api/admin/users/${userId}/send-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('actionFailed'));
      setSuccess(t('emailSent'));
      fetchHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <Typography variant="body2" color="text.secondary" mb={2}>
        {t('sendingTo')}: <strong>{userEmail}</strong>
      </Typography>

      <FormControl size="small" fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('emailTemplate')}</InputLabel>
        <Select value={templateId} label={t('emailTemplate')} onChange={(e) => applyTemplate(e.target.value)}>
          {TEMPLATES.map((tpl) => <MenuItem key={tpl.id} value={tpl.id}>{tpl.label}</MenuItem>)}
        </Select>
      </FormControl>

      <TextField
        fullWidth size="small" label={t('emailSubject')} value={subject}
        onChange={(e) => setSubject(e.target.value)} sx={{ mb: 2 }}
      />
      <TextField
        fullWidth multiline rows={6} label={t('emailBody')} value={body}
        onChange={(e) => setBody(e.target.value)} sx={{ mb: 2 }}
        placeholder={t('emailBodyPlaceholder')}
      />

      <Button
        variant="contained" startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send />}
        onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}
        sx={{ borderRadius: '8px' }}
      >
        {t('sendEmail')}
      </Button>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>{t('emailHistory')}</Typography>
        <Button size="small" startIcon={<History />} onClick={() => setShowHistory((v) => !v)} sx={{ borderRadius: '8px' }}>
          {showHistory ? t('hide') : t('show')}
        </Button>
      </Stack>

      {showHistory && (
        <Stack spacing={1}>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t('noEmailsYet')}</Typography>
          ) : history.map((log) => (
            <Paper key={log.id} variant="outlined" sx={{ p: 1.5, borderRadius: '8px' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Chip label="EMAIL_SENT" size="small" color="secondary" sx={{ mr: 1, fontSize: 11 }} />
                  <Typography variant="body2" component="span" color="text.secondary">{log.details}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">{new Date(log.created_at).toLocaleString('ka-GE')}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
