'use client';

import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors } from '@/theme';
import { type AssistantSettingsResponse, useAssistantSettings, useSaveAssistantSettings } from './assistant-api';

export function AssistantBehaviour() {
  const { data } = useAssistantSettings();
  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  return <BehaviourForm key={data.settings.updated_at} config={data} />;
}

function BehaviourForm({ config }: { config: AssistantSettingsResponse }) {
  const t = useTranslations('adminAssistant');
  const save = useSaveAssistantSettings();
  const [model, setModel] = useState(config.settings.model ?? '');
  const [rateLimit, setRateLimit] = useState(String(config.settings.rate_limit));
  const [instructions, setInstructions] = useState(config.settings.extra_instructions ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const rate = parseInt(rateLimit, 10);
  const rateValid = Number.isInteger(rate) && rate >= 1 && rate <= 200;
  // What an empty model field falls back to.
  const fallbackModel = config.env.env_model || config.default_model;

  const handleSave = async () => {
    setMessage(null);
    try {
      await save.mutateAsync({ model: model.trim() || null, rate_limit: rate, extra_instructions: instructions });
      setMessage({ type: 'success', text: t('saved') });
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 760 }}>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box>
        <Typography fontWeight={600}>{t('model')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('modelHint')}
        </Typography>
        <TextField
          fullWidth
          size="small"
          label={t('modelId')}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={fallbackModel}
          helperText={t('modelCurrent', { model: config.effective.model, fallback: fallbackModel })}
        />
      </Box>

      <Box>
        <Typography fontWeight={600}>{t('rateLimit')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('rateLimitHint')}
        </Typography>
        <TextField
          size="small"
          type="number"
          label={t('rateLimitLabel')}
          value={rateLimit}
          onChange={(e) => setRateLimit(e.target.value)}
          error={!rateValid}
          helperText={rateValid ? undefined : t('rateLimitInvalid')}
          inputProps={{ min: 1, max: 200 }}
          sx={{ width: 240 }}
        />
      </Box>

      <Box>
        <Typography fontWeight={600}>{t('instructions')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('instructionsHint')}
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={5}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t('instructionsPlaceholder')}
          inputProps={{ maxLength: 2000 }}
          helperText={`${instructions.length} / 2000`}
        />
      </Box>

      <Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={save.isPending || !rateValid}
          startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ textTransform: 'none', backgroundColor: colors.accent.main, '&:hover': { backgroundColor: colors.accent.hover } }}
        >
          {t('save')}
        </Button>
      </Box>
    </Stack>
  );
}
