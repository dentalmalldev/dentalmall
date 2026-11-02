'use client';

/**
 * AI shopping assistant: a floating button that opens a chat drawer. Right-side
 * drawer on desktop, full screen on phones. Mounted once in the locale layout;
 * hidden on back-office pages.
 *
 * Open it from anywhere, optionally asking straight away:
 *   openAssistant(query)
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Drawer,
  Fab,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { colors } from '@/theme';
import { getVisitSessionId } from '@/lib/visit-session';
import type { AssistantProduct, AssistantPublicConfig, AssistantResponse } from '@/types/models';

const OPEN_EVENT = 'dentalmall:assistant';
const STORE_KEY = 'dm-assistant-v1';
const STATUS_KEYS = ['status1', 'status2', 'status3'] as const;
const EXAMPLE_KEYS = ['example1', 'example2', 'example3', 'example4'] as const;
// Back-office areas have their own layouts and no shoppers.
const HIDDEN_ON = /^\/[a-z]{2}\/(admin|accountant|storage|vendor-dashboard)(\/|$)/;
// The bottom navigation is fixed at this z-index on phones; the drawer must sit
// above it or the nav covers the input.
const ABOVE_BOTTOM_NAV = 10000001;

/** Open the assistant, optionally asking a question straight away. */
export function openAssistant(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { question } }));
}

// One config request per page load, shared by every caller.
let configRequest: Promise<AssistantPublicConfig> | null = null;

/**
 * The assistant's public config: whether it's on (key configured, env kill
 * switch, admin switch) and how it looks. Null until the server has answered.
 */
export function useAssistantConfig(): AssistantPublicConfig | null {
  const [config, setConfig] = useState<AssistantPublicConfig | null>(null);
  useEffect(() => {
    configRequest ??= fetch('/api/assistant')
      .then((res) => (res.ok ? res.json() : { enabled: false, appearance: null }))
      .catch(() => ({ enabled: false, appearance: null }));
    let active = true;
    configRequest.then((value) => {
      if (active) setConfig(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return config;
}

/**
 * Whether the assistant is switched on. False until the server has answered, so
 * nothing that opens the assistant flashes up and disappears.
 */
export function useAssistantAvailable(): boolean {
  return useAssistantConfig()?.enabled === true;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  products?: AssistantProduct[];
  /** Log id from the API, for thumbs up/down. */
  id?: string;
  rated?: boolean;
  error?: boolean;
  /** Question to hand to the normal search when the assistant failed. */
  fallbackQuery?: string;
}

function formatPrice(n: number) {
  return `${n.toFixed(2).replace(/\.00$/, '')} ₾`;
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      <path d="M9 10h.01M12 10h.01M15 10h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ProductCard({ p, onOpen }: { p: AssistantProduct; onOpen: () => void }) {
  const t = useTranslations('assistant');
  const c = useTranslations('cart');
  const locale = useLocale();
  const name = locale === 'ka' ? p.name_ka : p.name;
  const price = formatPrice(p.price);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardActionArea
        component={Link}
        href={`/${locale}/products/${p.id}`}
        onClick={onOpen}
        sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', gap: 1.5, p: 1.25 }}
      >
        <Box sx={{ width: 64, height: 64, flex: 'none', borderRadius: 1.5, bgcolor: 'grey.100', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
          {p.image_url ? (
            // Plain <img>: product images are served unoptimized anyway.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Typography color="text.disabled" fontWeight={700}>D</Typography>
          )}
        </Box>
        <Stack sx={{ minWidth: 0, flex: 1 }} spacing={0.5}>
          <Typography variant="body2" fontWeight={500} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {name}
          </Typography>
          <Stack direction="row" alignItems="baseline" flexWrap="wrap" columnGap={1} sx={{ mt: 'auto' }}>
            <Typography fontWeight={700} color={p.original_price !== null ? 'error.main' : colors.text.primary}>
              {p.price_from ? t('priceFrom', { price }) : price}
            </Typography>
            {p.original_price !== null && (
              <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                {formatPrice(p.original_price)}
              </Typography>
            )}
            {p.unit && <Typography variant="caption" color="text.secondary">/ {p.unit}</Typography>}
            {p.availability === 'out_of_stock' && (
              <Chip size="small" label={t('outOfStock')} color="warning" variant="outlined" sx={{ ml: 'auto' }} />
            )}
          </Stack>
          {/* Same delivery wording as the cart: special-order items are
              orderable, they just take longer. */}
          {p.availability !== 'out_of_stock' && (
            <Typography variant="caption" color="text.secondary">
              {p.availability === 'in_stock' ? c('inStockDelivery') : c('specialOrderDelivery')}
            </Typography>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

export function AssistantChat() {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const pathname = usePathname();
  const config = useAssistantConfig();
  const look = config?.appearance ?? null;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore the conversation after a full page load (e.g. opening a product).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // Storage blocked: start fresh.
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Storage blocked: the conversation just won't survive a reload.
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) return;
    setStatusIdx(0);
    const timer = setInterval(() => setStatusIdx((i) => Math.min(i + 1, STATUS_KEYS.length - 1)), 3500);
    return () => clearInterval(timer);
  }, [busy]);

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || busy) return;
      setInput('');
      setBusy(true);
      const history = messages
        .filter((m) => !m.error)
        .map((m) => ({
          role: m.role,
          content: m.text + (m.products?.length ? `\n[shown: ${m.products.map((p) => p.name_ka).join('; ')}]` : ''),
        }));
      setMessages((prev) => [...prev, { role: 'user', text: question }]);

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, history, sessionId: getVisitSessionId() }),
        });
        if (res.status === 429) throw Object.assign(new Error('rate'), { rate: true });
        if (!res.ok) throw new Error('unavailable');
        const data: AssistantResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.reply || t('nothingFound'), products: data.products, id: data.id },
        ]);
      } catch (e) {
        const rate = (e as { rate?: boolean }).rate;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            error: true,
            text: rate ? t('rateLimited') : t('unavailable'),
            fallbackQuery: rate ? undefined : question,
          },
        ]);
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, messages, t]
  );

  // openAssistant(question) from anywhere on the site.
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<{ question?: string }>).detail?.question;
      if (q) ask(q);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [ask]);

  if (!config?.enabled || (pathname && HIDDEN_ON.test(pathname))) return null;

  // Admin-set look; anything left empty falls back to the default wording/colour.
  const pick = (ka: string | null | undefined, en: string | null | undefined) => (locale === 'ka' ? ka : en) || null;
  const buttonLabel = pick(look?.button_label_ka, look?.button_label_en) || t('title');
  const welcomeTitle = pick(look?.welcome_title_ka, look?.welcome_title_en) || t('emptyTitle');
  const welcomeText = pick(look?.welcome_text_ka, look?.welcome_text_en) || t('emptyHint');
  const customExamples = (locale === 'ka' ? look?.examples_ka : look?.examples_en) ?? [];
  const examples = customExamples.length > 0 ? customExamples : EXAMPLE_KEYS.map((key) => t(key));
  const accent = look?.button_color || colors.accent.main;
  // A custom colour has no hand-picked hover shade, so darken it slightly instead.
  const accentHover = look?.button_color ? { bgcolor: accent, filter: 'brightness(0.9)' } : { bgcolor: colors.accent.hover };
  const side = look?.button_position ?? 'right';
  const showOnMobile = look?.show_on_mobile ?? true;

  const rate = (idx: number, helpful: boolean) => {
    const m = messages[idx];
    if (!m.id || m.rated) return;
    setMessages((prev) => prev.map((x, i) => (i === idx ? { ...x, rated: true } : x)));
    fetch('/api/assistant/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, helpful }),
    }).catch(() => {});
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(input);
    }
  };

  return (
    <>
      {!open && (
        <Fab
          variant={fullScreen ? 'circular' : 'extended'}
          aria-label={buttonLabel}
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            [side]: 20,
            // Hidden on phones when the admin turned that off; openAssistant() still opens it.
            display: showOnMobile ? undefined : { xs: 'none', sm: 'inline-flex' },
            // Clear the bottom navigation on phones (hidden from md up).
            bottom: {
              xs: 'calc(84px + env(safe-area-inset-bottom, 0px))',
              md: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            },
            zIndex: theme.zIndex.speedDial,
            gap: 1,
            textTransform: 'none',
            bgcolor: accent,
            color: '#FFFFFF',
            '&:hover': accentHover,
          }}
        >
          <ChatIcon />
          {!fullScreen && buttonLabel}
        </Fab>
      )}

      <Drawer
        anchor={side}
        open={open}
        onClose={() => setOpen(false)}
        sx={{ zIndex: ABOVE_BOTTOM_NAV }}
        SlideProps={{ onEntered: () => inputRef.current?.focus() }}
        PaperProps={{ sx: { width: fullScreen ? '100%' : 420, display: 'flex', flexDirection: 'column' } }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', pt: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: accent, color: '#FFFFFF', display: 'grid', placeItems: 'center' }}>
            <ChatIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600} lineHeight={1.2}>{buttonLabel}</Typography>
            <Typography variant="caption" color="text.secondary">{t('subtitle')}</Typography>
          </Box>
          {messages.length > 0 && (
            <Tooltip title={t('newChat')}>
              <IconButton size="small" onClick={() => setMessages([])} aria-label={t('newChat')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={() => setOpen(false)} aria-label={t('close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </IconButton>
        </Stack>

        {/* Conversation */}
        <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, bgcolor: 'grey.50' }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', pt: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>{welcomeTitle}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>{welcomeText}</Typography>
              <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
                {examples.map((q) => (
                  <Chip key={q} label={q} variant="outlined" onClick={() => ask(q)} sx={{ bgcolor: 'background.paper' }} />
                ))}
              </Stack>
            </Box>
          )}

          <Stack spacing={2}>
            {messages.map((m, i) => (
              <Stack key={i} spacing={1} alignItems={m.role === 'user' ? 'flex-end' : 'stretch'}>
                <Box
                  sx={{
                    maxWidth: '88%',
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 3,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    ...(m.role === 'user'
                      ? { bgcolor: accent, color: '#FFFFFF', borderBottomRightRadius: 6 }
                      : m.error
                        ? { bgcolor: 'warning.light', color: 'warning.contrastText', alignSelf: 'flex-start' }
                        : { bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderBottomLeftRadius: 6, alignSelf: 'flex-start' }),
                  }}
                >
                  <Typography variant="body2">{m.text}</Typography>
                  {m.fallbackQuery && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <Link href={`/${locale}/products?search=${encodeURIComponent(m.fallbackQuery)}`}>
                        {t('fallbackSearch', { query: m.fallbackQuery })}
                      </Link>
                    </Typography>
                  )}
                </Box>
                {m.products?.map((p) => (
                  <ProductCard key={p.id} p={p} onOpen={() => { if (fullScreen) setOpen(false); }} />
                ))}
                {m.role === 'assistant' && m.id && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {m.rated ? (
                      <Typography variant="caption" color="text.secondary">{t('thanksForRating')}</Typography>
                    ) : (
                      <>
                        <Typography variant="caption" color="text.secondary">{t('wasHelpful')}</Typography>
                        <IconButton size="small" aria-label={t('yes')} onClick={() => rate(i, true)}>👍</IconButton>
                        <IconButton size="small" aria-label={t('no')} onClick={() => rate(i, false)}>👎</IconButton>
                      </>
                    )}
                  </Stack>
                )}
              </Stack>
            ))}
            {busy && (
              <Box sx={{ alignSelf: 'flex-start', px: 1.75, py: 1.25, borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">{t(STATUS_KEYS[statusIdx])}</Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Input */}
        <Box component="form" onSubmit={onSubmit} sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', pb: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, pl: 1.75, pr: 0.75, py: 0.75, '&:focus-within': { borderColor: accent } }}>
            <InputBase
              inputRef={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('placeholder')}
              multiline
              maxRows={5}
              inputProps={{ maxLength: 500, 'aria-label': t('inputLabel') }}
              sx={{ flex: 1, py: 0.5 }}
            />
            <IconButton
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('send')}
              sx={{
                bgcolor: accent,
                color: '#FFFFFF',
                '&:hover': accentHover,
                '&.Mui-disabled': { bgcolor: colors.accent.disabled, color: colors.accent.disabledText },
              }}
            >
              <SendIcon />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.75 }}>
            {t('disclaimer')}
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}
