'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import { useMessages, useTranslations } from 'next-intl';
import { RemoveIcon } from '@/icons/remove-icon/remove-icon';
import { AddIcon } from '@/icons/add-icon/add-icon';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export function FAQ() {
  const messages = useMessages();
  const t = useTranslations('faqSection');
  const faqs = messages.faqs as FAQ[];
  const [expanded, setExpanded] = useState<string | false>('1');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ padding: { xs: '16px 16px', md: '28px 120px' } }}>
      <Typography
        variant="h4"
        sx={{
          color: '#3E4388',
          marginBottom: 3,
          textAlign: 'center',
        }}
      >
        {t('title')}
      </Typography>

      <Box sx={{ margin: '0 auto' }}>
        {faqs.map((faq) => (
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
                expanded === faq.id ? (
                  <RemoveIcon />
                ) : (
                  <AddIcon />
                )
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
            <AccordionDetails
              sx={{
                padding: '0 24px 24px 24px',
              }}
            >
              <Typography
                sx={{
                  color: '#6B7280',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={{ textAlign: 'center', marginTop: 4 }}>
        <Button
          sx={{
            color: '#5B6ECD',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {t('viewAll')}
        </Button>
      </Box>
    </Box>
  );
}
