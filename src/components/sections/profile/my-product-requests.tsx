'use client';

import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Collapse,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useLocale, useTranslations } from 'next-intl';
import { useMyProductRequests } from '@/hooks';
import type { MyProductRequestItem } from '@/types/models';

/** One label/value line of what the customer typed. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500} sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Box>
  );
}

export function MyProductRequests() {
  const t = useTranslations('myProductRequests');
  const tf = useTranslations('productRequest.fields');
  const locale = useLocale();
  const { data: items = [], isPending, isError, refetch } = useMyProductRequests();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const title = (
    <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
      {t('title')}
    </Typography>
  );

  if (isPending) {
    return (
      <Box>
        {title}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        {title}
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', backgroundColor: '#f5f6fa' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('loadError')}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()} sx={{ borderRadius: '100px', textTransform: 'none' }}>
            {t('retry')}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {title}

      {items.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', backgroundColor: '#f5f6fa' }}>
          <Typography variant="h6" color="text.secondary">
            {t('empty')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {items.map((item: MyProductRequestItem) => {
            const isOpen = expanded.has(item.id);
            const detailsId = `product-request-${item.id}`;
            return (
              <Paper
                key={item.id}
                sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <ButtonBase
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={detailsId}
                  sx={{
                    width: '100%',
                    p: { xs: 2, sm: 3 },
                    backgroundColor: '#f5f6fa',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    gap: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                      sx={{ overflowWrap: 'anywhere' }}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatDate(item.created_at)}
                    </Typography>
                  </Box>
                  {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ButtonBase>

                <Collapse in={isOpen} id={detailsId}>
                  <Divider />
                  <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
                    {item.invoice_name && <Field label={tf('invoice_name')}>{item.invoice_name}</Field>}
                    <Field label={tf('description')}>{item.description}</Field>
                    <Field label={tf('quantity')}>{item.quantity}</Field>
                    <Field label={tf('estimated_price')}>{item.estimated_price}</Field>
                    <Field label={tf('store')}>{item.store}</Field>
                    {item.photo_url && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {tf('photo_url')}
                        </Typography>
                        <MuiLink href={item.photo_url} target="_blank" rel="noopener noreferrer">
                          <Avatar
                            variant="rounded"
                            src={item.photo_url}
                            alt={item.name}
                            sx={{ width: 96, height: 96 }}
                          />
                        </MuiLink>
                      </Box>
                    )}
                  </Stack>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
