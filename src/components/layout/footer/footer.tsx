'use client';

import {
  Box,
  Container,
  Stack,
  Typography,
  Link as MuiLink,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowUpward } from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Logo } from '@/icons';

interface FooterLink {
  labelKey: string;
  href: string;
}

const POLICY_LINKS: FooterLink[] = [
  { labelKey: 'termsAndConditions', href: '/terms' },
  { labelKey: 'privacyPolicy', href: '/privacy' },
  { labelKey: 'shippingAndReturns', href: '/shipping-returns' },
  { labelKey: 'newProducts', href: '/categories' },
  { labelKey: 'requestClinicAccount', href: '/profile?tab=clinic' },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { labelKey: 'myAccount', href: '/profile' },
  { labelKey: 'orders', href: '/orders' },
  { labelKey: 'addresses', href: '/profile?tab=addresses' },
  { labelKey: 'cart', href: '/cart' },
  { labelKey: 'requestVendorAccount', href: '/profile?tab=vendor' },
];

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  // Hide on admin pages (admin has its own shell)
  if (pathname?.includes('/admin')) {
    return null;
  }

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderLinkColumn = (
    links: FooterLink[],
    headingKey?: 'policiesHeading' | 'accountHeading'
  ) => (
    <Stack spacing={1.25}>
      {headingKey && (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: '#3E4388', mb: 0.5 }}
        >
          {t(headingKey)}
        </Typography>
      )}
      {links.map((link) => (
        <MuiLink
          key={link.labelKey}
          component={Link}
          href={`/${locale}${link.href}`}
          underline="hover"
          sx={{
            color: '#3E4388CC',
            fontSize: '14px',
            '&:hover': { color: '#5B6ECD' },
          }}
        >
          {t(link.labelKey)}
        </MuiLink>
      ))}
    </Stack>
  );

  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid #E5E7EB',
        bgcolor: '#FFFFFF',
        mt: { xs: 8, md: 12 },
        // Mobile bottom nav is fixed at the bottom — give the footer breathing room above it
        pb: { xs: '90px', md: 0 },
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 5 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'auto 1fr 1fr auto',
            },
            alignItems: 'start',
          }}
        >
          {/* Brand + contact */}
          <Stack spacing={2} sx={{ minWidth: { md: 220 } }}>
            <Box sx={{ width: { xs: 140, md: 170 } }}>
              <Logo variant="vertical" width={170} height={180} />
            </Box>
            <Stack spacing={1.25} sx={{ fontSize: '14px', color: '#3E4388CC' }}>
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                <Box component="span" sx={{ fontWeight: 600, color: '#3E4388' }}>
                  {t('addressLabel')}:
                </Box>{' '}
                {t('addressValue')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                <Box component="span" sx={{ fontWeight: 600, color: '#3E4388' }}>
                  {t('phoneLabel')}:
                </Box>{' '}
                <MuiLink
                  href={`tel:${t('phoneValue').replace(/\s+/g, '')}`}
                  underline="hover"
                  sx={{ color: 'inherit' }}
                >
                  {t('phoneValue')}
                </MuiLink>
              </Typography>
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                <Box component="span" sx={{ fontWeight: 600, color: '#3E4388' }}>
                  {t('emailLabel')}:
                </Box>{' '}
                <MuiLink
                  href={`mailto:${t('emailValue')}`}
                  underline="hover"
                  sx={{ color: 'inherit' }}
                >
                  {t('emailValue')}
                </MuiLink>
              </Typography>
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                <Box component="span" sx={{ fontWeight: 600, color: '#3E4388' }}>
                  {t('workingHoursLabel')}:
                </Box>{' '}
                {t('workingHoursValue')}
              </Typography>
            </Stack>
          </Stack>

          {/* Policy links */}
          {renderLinkColumn(POLICY_LINKS, isMobile ? 'policiesHeading' : undefined)}

          {/* Account links */}
          {renderLinkColumn(ACCOUNT_LINKS, isMobile ? 'accountHeading' : undefined)}

          {/* Scroll to top — desktop only; mobile uses BottomNavigation instead */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
            <IconButton
              onClick={handleScrollTop}
              aria-label={t('backToTop')}
              sx={{
                bgcolor: '#5B6ECD',
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': { bgcolor: '#4A5BC0' },
              }}
            >
              <ArrowUpward />
            </IconButton>
          </Box>
        </Box>

        {/* Copyright */}
        <Box
          sx={{
            borderTop: '1px solid #F0F1F8',
            mt: { xs: 3, md: 4 },
            pt: { xs: 2, md: 3 },
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#3E438899', fontSize: '13px', textAlign: 'center' }}
          >
            {t('copyright', { year: new Date().getFullYear() })}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
