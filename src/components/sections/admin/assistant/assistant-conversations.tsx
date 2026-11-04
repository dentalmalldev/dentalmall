'use client';

import { useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandLess, ExpandMore, Search } from '@mui/icons-material';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { PaginationControl } from '@/components/common';
import { adminRequest } from './assistant-api';

const FILTERS = ['all', 'no_products', 'disliked', 'liked', 'errors'] as const;
type Filter = (typeof FILTERS)[number];

interface LogRow {
  id: string;
  question: string;
  reply: string;
  searches: string[];
  invented: number;
  model: string;
  cost_usd: number;
  duration_ms: number;
  helpful: boolean | null;
  error: string | null;
  created_at: string;
  products: Array<{ id: string; name: string | null; name_ka: string | null }>;
}

interface LogsResponse {
  data: LogRow[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export function AssistantConversations() {
  const t = useTranslations('adminAssistant');
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'assistant', 'logs', filter, search, page],
    queryFn: () =>
      adminRequest<LogsResponse>(
        `/api/admin/assistant/logs?${new URLSearchParams({ filter, search, page: String(page) })}`
      ),
  });

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={t(`filter.${f}`)}
              onClick={() => changeFilter(f)}
              color={filter === f ? 'primary' : 'default'}
              variant={filter === f ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
        <TextField
          size="small"
          placeholder={t('searchQuestions')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearch(searchInput.trim());
              setPage(1);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { md: 280 } }}
        />
      </Stack>

      {isLoading || !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data.data.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', backgroundColor: '#f5f6fa' }}>
          <Typography color="text.secondary">{t('noConversations')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5} sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {data.data.map((row) => {
            const open = expanded === row.id;
            return (
              <Paper key={row.id} variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  onClick={() => setExpanded(open ? null : row.id)}
                  sx={{ p: 2, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                      {row.question}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(row.created_at)}
                      </Typography>
                      {row.error ? (
                        <Chip size="small" color="error" variant="outlined" label={t('errorChip')} />
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={t('productsShown', { count: row.products.length })}
                          color={row.products.length ? 'default' : 'warning'}
                        />
                      )}
                      {row.helpful === true && <Chip size="small" color="success" label="👍" />}
                      {row.helpful === false && <Chip size="small" color="error" label="👎" />}
                      {row.invented > 0 && (
                        <Chip size="small" color="error" label={t('inventedChip', { count: row.invented })} />
                      )}
                    </Stack>
                  </Box>
                  {open ? <ExpandLess /> : <ExpandMore />}
                </Stack>

                <Collapse in={open}>
                  <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                    {row.error ? (
                      <Typography variant="body2" color="error.main" sx={{ overflowWrap: 'anywhere' }}>
                        {row.error}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {row.reply}
                      </Typography>
                    )}
                    {row.products.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('shownProducts')}
                        </Typography>
                        <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
                          {row.products.map((p) => (
                            <li key={p.id}>
                              {p.name ? (
                                <Link href={`/${locale}/products/${p.id}`} target="_blank">
                                  {locale === 'ka' ? p.name_ka : p.name}
                                </Link>
                              ) : (
                                <Typography variant="body2" component="span" color="text.secondary">
                                  {t('deletedProduct')}
                                </Typography>
                              )}
                            </li>
                          ))}
                        </Stack>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>
                      {row.searches.length > 0 && `${t('searchedFor')}: ${row.searches.join(', ')} · `}
                      {row.model} · {t('seconds', { value: (row.duration_ms / 1000).toFixed(1) })} · ${row.cost_usd.toFixed(5)}
                    </Typography>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}

      {data && data.pagination.total > data.pagination.limit && (
        <PaginationControl
          page={page}
          pageSize={data.pagination.limit}
          total={data.pagination.total}
          onPageChange={setPage}
        />
      )}
    </Stack>
  );
}
