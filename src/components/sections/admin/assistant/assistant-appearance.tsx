'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useLocale, useTranslations } from 'next-intl';
import { colors } from '@/theme';
import { type AssistantSettings, useAssistantSettings, useSaveAssistantSettings } from './assistant-api';

const MAX_EXAMPLES = 4;

type Lang = 'ka' | 'en';
type TextKey = 'button_label' | 'welcome_title' | 'welcome_text';

interface FormState {
  button_label_ka: string;
  button_label_en: string;
  welcome_title_ka: string;
  welcome_title_en: string;
  welcome_text_ka: string;
  welcome_text_en: string;
  examples_ka: string[];
  examples_en: string[];
  button_color: string;
  button_position: 'right' | 'left';
  show_on_mobile: boolean;
}

const padExamples = (list: string[]) => [...list, ...Array(MAX_EXAMPLES).fill('')].slice(0, MAX_EXAMPLES);

function toForm(s: AssistantSettings): FormState {
  return {
    button_label_ka: s.button_label_ka ?? '',
    button_label_en: s.button_label_en ?? '',
    welcome_title_ka: s.welcome_title_ka ?? '',
    welcome_title_en: s.welcome_title_en ?? '',
    welcome_text_ka: s.welcome_text_ka ?? '',
    welcome_text_en: s.welcome_text_en ?? '',
    examples_ka: padExamples(s.examples_ka),
    examples_en: padExamples(s.examples_en),
    button_color: s.button_color ?? '',
    button_position: s.button_position,
    show_on_mobile: s.show_on_mobile,
  };
}

export function AssistantAppearance() {
  const { data } = useAssistantSettings();
  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  // Keyed by the save time so the form starts from what's stored after each save.
  return <AppearanceForm key={data.settings.updated_at} initial={data.settings} />;
}

function AppearanceForm({ initial }: { initial: AssistantSettings }) {
  const t = useTranslations('adminAssistant');
  const chat = useTranslations('assistant');
  const locale = useLocale();
  const save = useSaveAssistantSettings();
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [previewLang, setPreviewLang] = useState<Lang>(locale === 'ka' ? 'ka' : 'en');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setExample = (lang: Lang, index: number, value: string) =>
    setForm((f) => {
      const list = [...f[`examples_${lang}`]];
      list[index] = value;
      return { ...f, [`examples_${lang}`]: list };
    });

  const colorValid = form.button_color === '' || /^#[0-9a-fA-F]{6}$/.test(form.button_color);

  const handleSave = async () => {
    setMessage(null);
    try {
      await save.mutateAsync({
        ...form,
        examples_ka: form.examples_ka.map((e) => e.trim()).filter(Boolean),
        examples_en: form.examples_en.map((e) => e.trim()).filter(Boolean),
        button_color: form.button_color || null,
      });
      setMessage({ type: 'success', text: t('saved') });
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    }
  };

  // Preview: the stored text, else the default. Defaults are only loaded for
  // the admin's own language, so the other one shows a placeholder.
  const preview = (key: TextKey, fallbackKey: 'title' | 'emptyTitle' | 'emptyHint') =>
    form[`${key}_${previewLang}`] || (previewLang === locale ? chat(fallbackKey) : t('defaultText'));
  const previewExamples = form[`examples_${previewLang}`].filter((e) => e.trim());
  const accent = colorValid && form.button_color ? form.button_color : colors.accent.main;

  const textRow = (key: TextKey, label: string, multiline = false, maxLength = 80) => (
    <Grid container spacing={2}>
      {(['ka', 'en'] as const).map((lang) => (
        <Grid key={lang} size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            label={`${label} (${lang.toUpperCase()})`}
            value={form[`${key}_${lang}`]}
            onChange={(e) => set(`${key}_${lang}`, e.target.value)}
            placeholder={t('leaveEmptyForDefault')}
            multiline={multiline}
            minRows={multiline ? 2 : undefined}
            inputProps={{ maxLength }}
          />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Stack spacing={3}>
          {message && (
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Box>
            <Typography fontWeight={600} sx={{ mb: 1.5 }}>
              {t('texts')}
            </Typography>
            <Stack spacing={2}>
              {textRow('button_label', t('buttonLabel'), false, 40)}
              {textRow('welcome_title', t('welcomeTitle'))}
              {textRow('welcome_text', t('welcomeText'), true, 300)}
            </Stack>
          </Box>

          <Box>
            <Typography fontWeight={600}>{t('examples')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('examplesHint')}
            </Typography>
            <Grid container spacing={2}>
              {(['ka', 'en'] as const).map((lang) => (
                <Grid key={lang} size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1}>
                    {form[`examples_${lang}`].map((value, i) => (
                      <TextField
                        key={i}
                        size="small"
                        label={`${t('example')} ${i + 1} (${lang.toUpperCase()})`}
                        value={value}
                        onChange={(e) => setExample(lang, i, e.target.value)}
                        inputProps={{ maxLength: 80 }}
                      />
                    ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography fontWeight={600} sx={{ mb: 1.5 }}>
              {t('look')}
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="input"
                  type="color"
                  value={colorValid && form.button_color ? form.button_color : colors.accent.main}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('button_color', e.target.value.toUpperCase())}
                  aria-label={t('buttonColor')}
                  sx={{ width: 44, height: 40, p: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <TextField
                  size="small"
                  label={t('buttonColor')}
                  value={form.button_color}
                  onChange={(e) => set('button_color', e.target.value.trim())}
                  placeholder={colors.accent.main}
                  error={!colorValid}
                  helperText={colorValid ? undefined : t('colorInvalid')}
                  sx={{ width: 180 }}
                />
                {form.button_color && (
                  <Button size="small" onClick={() => set('button_color', '')} sx={{ textTransform: 'none' }}>
                    {t('resetColor')}
                  </Button>
                )}
              </Stack>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('buttonPosition')}
                </Typography>
                <RadioGroup
                  row
                  value={form.button_position}
                  onChange={(e) => set('button_position', e.target.value as 'right' | 'left')}
                >
                  <FormControlLabel value="right" control={<Radio size="small" />} label={t('right')} />
                  <FormControlLabel value="left" control={<Radio size="small" />} label={t('left')} />
                </RadioGroup>
              </Box>

              <FormControlLabel
                control={<Switch checked={form.show_on_mobile} onChange={(e) => set('show_on_mobile', e.target.checked)} />}
                label={t('showOnMobile')}
              />
              {!form.show_on_mobile && (
                <Typography variant="caption" color="text.secondary">
                  {t('showOnMobileHint')}
                </Typography>
              )}
            </Stack>
          </Box>

          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={save.isPending || !colorValid}
              startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ textTransform: 'none', backgroundColor: colors.accent.main, '&:hover': { backgroundColor: colors.accent.hover } }}
            >
              {t('save')}
            </Button>
          </Box>
        </Stack>
      </Grid>

      {/* Live preview */}
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', position: { lg: 'sticky' }, top: { lg: 16 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography fontWeight={600}>{t('preview')}</Typography>
            <ToggleButtonGroup size="small" exclusive value={previewLang} onChange={(_, v) => v && setPreviewLang(v)}>
              <ToggleButton value="ka">KA</ToggleButton>
              <ToggleButton value="en">EN</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: accent }} />
              <Typography fontWeight={600}>{preview('button_label', 'title')}</Typography>
            </Stack>
            <Box sx={{ p: 2.5, bgcolor: 'grey.50', textAlign: 'center' }}>
              <Typography fontWeight={600} gutterBottom>
                {preview('welcome_title', 'emptyTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {preview('welcome_text', 'emptyHint')}
              </Typography>
              <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
                {(previewExamples.length ? previewExamples : [t('defaultExamples')]).map((q, i) => (
                  <Chip key={i} label={q} variant="outlined" size="small" sx={{ bgcolor: 'background.paper' }} />
                ))}
              </Stack>
            </Box>
          </Box>
          <Stack direction="row" justifyContent={form.button_position === 'left' ? 'flex-start' : 'flex-end'} sx={{ mt: 2 }}>
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: '100px',
                bgcolor: accent,
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {preview('button_label', 'title')}
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
