'use client';

import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { Celebration } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { creditService } from '@/services';
import { myCreditKeys, useMyCredit } from '@/hooks/useMyCredit';
import { formatLari } from '@/lib/credit/money';
import { colors } from '@/theme';

/**
 * Congratulates the customer once for credit an admin added: on sign-in or the
 * next page load, with the sum of every addition they haven't closed this modal
 * for. Closing it marks exactly those additions as seen. Subtractions never
 * count (the API only returns positive admin additions).
 */
export function CreditNotice() {
  const t = useTranslations('credit');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { unseenAmount, unseenIds } = useMyCredit();
  // Hides the modal at once on close, before the refetch confirms it's seen.
  const [closedFor, setClosedFor] = useState<string | null>(null);

  const key = unseenIds.join(',');
  const open = unseenAmount > 0 && closedFor !== key;

  const handleClose = async () => {
    setClosedFor(key);
    if (!user || unseenIds.length === 0) return;
    try {
      await creditService.markSeen(user, unseenIds);
    } catch (error) {
      // Not marked: it shows again on the next load, which is the safe side.
      console.error('Failed to mark credit as seen:', error);
    }
    queryClient.invalidateQueries({ queryKey: myCreditKeys.all });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'rgba(91, 110, 205, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <Celebration sx={{ fontSize: 40, color: colors.accent.main }} />
        </Box>
        <Typography variant="body1" sx={{ color: colors.text.primary, lineHeight: 1.6 }}>
          {t('congrats', { amount: formatLari(unseenAmount) })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            borderRadius: '100px',
            textTransform: 'none',
            px: 4,
            backgroundColor: colors.accent.main,
            '&:hover': { backgroundColor: colors.accent.hover },
          }}
        >
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
