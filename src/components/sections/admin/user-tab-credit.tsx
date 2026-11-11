'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
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
import { AccountBalanceWalletOutlined } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { hasAtMostTwoDecimals, MAX_CREDIT_CHANGE, tetriToDecimal, toTetri } from '@/lib/credit/money';
import type { CreditTransaction, CreditTransactionType } from '@/types/models';

type ChangeType = 'ADD' | 'SUBTRACT' | 'SET';

const TYPE_COLOR: Record<CreditTransactionType, 'success' | 'warning' | 'info' | 'default'> = {
  ADMIN_ADD: 'success',
  ADMIN_SUBTRACT: 'warning',
  ADMIN_SET: 'info',
  ORDER_USED: 'default',
  ORDER_RETURNED: 'success',
};

const KNOWN_ERRORS = ['amount_range', 'amount_decimals', 'note_required', 'note_too_long', 'negative_balance'];

/** Admin: a user's store credit — change it (with a required note) and see every change. */
export function UserTabCredit({ userId }: { userId: string }) {
  const t = useTranslations('admin.credit');
  const tAdmin = useTranslations('admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [type, setType] = useState<ChangeType>('ADD');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCredit = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${userId}/credit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: { balance: string; transactions: CreditTransaction[] } = await res.json();
      setBalance(parseFloat(data.balance) || 0);
      setHistory(data.transactions);
    } catch {
      setError(tAdmin('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [user, userId, tAdmin]);

  useEffect(() => {
    fetchCredit();
  }, [fetchCredit]);

  // Same rules as the API (src/lib/validations/credit.ts), checked here first.
  const parsedAmount = amount.trim() === '' ? NaN : Number(amount);
  const amountValid =
    Number.isFinite(parsedAmount) &&
    hasAtMostTwoDecimals(parsedAmount) &&
    parsedAmount <= MAX_CREDIT_CHANGE &&
    (type === 'SET' ? parsedAmount >= 0 : parsedAmount > 0);
  const resultTetri = !amountValid
    ? null
    : type === 'ADD'
      ? toTetri(balance) + toTetri(parsedAmount)
      : type === 'SUBTRACT'
        ? toTetri(balance) - toTetri(parsedAmount)
        : toTetri(parsedAmount);
  const amountError =
    amount.trim() === ''
      ? null
      : !amountValid
        ? hasAtMostTwoDecimals(parsedAmount)
          ? t('errors.amount_range')
          : t('errors.amount_decimals')
        : resultTetri !== null && resultTetri < 0
          ? t('errors.negative_balance')
          : null;
  const canSave = amountValid && resultTetri !== null && resultTetri >= 0 && note.trim() !== '' && !saving;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${userId}/credit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: parsedAmount, note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof data.error === 'string' ? data.error : '';
        throw new Error(KNOWN_ERRORS.includes(code) ? t(`errors.${code}`) : tAdmin('actionFailed'));
      }
      setSuccess(t('saved'));
      setAmount('');
      setNote('');
      await fetchCredit();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tAdmin('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const formatSigned = (value: string) => {
    const tetri = toTetri(value);
    return `${tetri > 0 ? '+' : tetri < 0 ? '−' : ''}₾${tetriToDecimal(Math.abs(tetri))}`;
  };

  const whoMade = (row: CreditTransaction) => {
    if (row.admin) return `${row.admin.first_name} ${row.admin.last_name}`;
    if (row.order) return t('order', { number: row.order.order_number });
    return t('system');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }}>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccountBalanceWalletOutlined color="primary" />
        <Box>
          <Typography variant="body2" color="text.secondary">{t('currentBalance')}</Typography>
          <Typography variant="h5" fontWeight={700} color="primary.main">₾{balance.toFixed(2)}</Typography>
        </Box>
      </Paper>

      <Stack spacing={2}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type}
          onChange={(_e, value: ChangeType | null) => value && setType(value)}
        >
          <ToggleButton value="ADD" sx={{ textTransform: 'none' }}>{t('add')}</ToggleButton>
          <ToggleButton value="SUBTRACT" sx={{ textTransform: 'none' }}>{t('subtract')}</ToggleButton>
          <ToggleButton value="SET" sx={{ textTransform: 'none' }}>{t('set')}</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          size="small"
          type="number"
          label={type === 'SET' ? t('newBalance') : t('amount')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ min: type === 'SET' ? 0 : 0.01, max: MAX_CREDIT_CHANGE, step: 0.01 }}
          error={!!amountError}
          helperText={
            amountError ??
            (resultTetri !== null ? t('result', { amount: tetriToDecimal(resultTetri) }) : t('maxHint', { max: MAX_CREDIT_CHANGE.toLocaleString('en-US') }))
          }
        />

        <TextField
          size="small"
          multiline
          rows={2}
          required
          label={t('note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          inputProps={{ maxLength: 500 }}
        />

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ borderRadius: '8px', alignSelf: 'flex-start' }}
        >
          {tAdmin('save')}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle2" fontWeight={600} mb={1.5}>{t('history')}</Typography>

      {history.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('noHistory')}</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('date')}</TableCell>
                <TableCell>{t('type')}</TableCell>
                <TableCell align="right">{t('amountColumn')}</TableCell>
                <TableCell align="right">{t('balanceAfter')}</TableCell>
                <TableCell>{t('by')}</TableCell>
                <TableCell>{t('note')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.created_at).toLocaleString('ka-GE')}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={TYPE_COLOR[row.type]} label={t(`types.${row.type}`)} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatSigned(row.amount)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>₾{tetriToDecimal(toTetri(row.balance_after))}</TableCell>
                  <TableCell>{whoMade(row)}</TableCell>
                  <TableCell sx={{ overflowWrap: 'anywhere', minWidth: 140 }}>{row.note ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
