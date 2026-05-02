'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useMessages, useTranslations } from 'next-intl';

interface FAQ {
  id: string;
  category?: string;
  question: string;
  answer: string;
}

const CATEGORY_ORDER = ['general', 'suppliers'] as const;
type CategoryKey = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABEL_KEYS: Record<CategoryKey, string> = {
  general: 'categoryGeneral',
  suppliers: 'categorySuppliers',
};

export function FAQContent() {
  const messages = useMessages();
  const t = useTranslations('faqSection');
  const faqs = messages.faqs as FAQ[];
  const [expanded, setExpanded] = useState<string | false>('1');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const grouped = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const key = faq.category || 'general';
    (acc[key] ||= []).push(faq);
    return acc;
  }, {});

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]?.length),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c as CategoryKey)),
  ];

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Typography
        variant="h4"
        sx={{
          color: '#3E4388',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        {t('title')}
      </Typography>

      {orderedCategories.map((categoryKey) => (
        <Box key={categoryKey} sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              color: '#3E4388',
              fontWeight: 700,
              mb: 2,
              pb: 1,
              borderBottom: '2px solid #5B6ECD',
            }}
          >
            {CATEGORY_LABEL_KEYS[categoryKey as CategoryKey]
              ? t(CATEGORY_LABEL_KEYS[categoryKey as CategoryKey])
              : categoryKey}
          </Typography>

          {grouped[categoryKey].map((faq) => (
            <Accordion
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={handleChange(faq.id)}
              sx={{
                marginBottom: 2,
                boxShadow: 'none',
                borderBottom: '1px solid #E5E7EB',
                borderRadius: '8px !important',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0',
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMore
                    sx={{
                      transition: 'transform 0.2s',
                      transform: expanded === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                }
                sx={{
                  padding: '16px 24px',
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography
                  sx={{
                    color: '#2C2957',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: '0 24px 24px 24px' }}>
                <Typography
                  sx={{
                    color: '#6B7280',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}
    </Box>
  );
}
