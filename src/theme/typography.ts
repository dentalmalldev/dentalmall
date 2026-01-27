import { createTheme, TypographyVariantsOptions } from '@mui/material/styles';

// Base theme to access breakpoints
const baseTheme = createTheme();

export const typography: TypographyVariantsOptions = {
  fontFamily: '"Noto Sans Georgian", sans-serif',

  // Display/Hero - Headers desktop: 36px/900 → mobile: 32px/800
  h1: {
    fontWeight: 800,
    fontSize: '32px',
    lineHeight: '44px',
    [baseTheme.breakpoints.up('md')]: {
      fontWeight: 900,
      fontSize: '36px',
      lineHeight: '49px',
    },
  },

  // Header 1: desktop 36px/700 → mobile 28px/600
  h2: {
    fontWeight: 600,
    fontSize: '28px',
    lineHeight: '38px',
    [baseTheme.breakpoints.up('md')]: {
      fontWeight: 700,
      fontSize: '36px',
      lineHeight: '49px',
    },
  },

  // Header 2: desktop 32px/600 → mobile 24px/600
  h3: {
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: '33px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '32px',
      lineHeight: '44px',
    },
  },

  // Header 3: desktop 24px/600 → mobile 20px/600
  h4: {
    fontWeight: 600,
    fontSize: '20px',
    lineHeight: '27px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '24px',
      lineHeight: '33px',
    },
  },

  // Header 4: desktop 20px/600 → mobile 18px/600
  h5: {
    fontWeight: 600,
    fontSize: '18px',
    lineHeight: '24px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '20px',
      lineHeight: '27px',
    },
  },

  // Header 5: desktop 18px/600 → mobile 16px/600
  h6: {
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '22px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '18px',
      lineHeight: '24px',
    },
  },

  // Body L: desktop 18px/400 → mobile 16px/400
  body1: {
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '22px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '18px',
      lineHeight: '24px',
    },
  },

  // Body M: desktop 16px/400 → mobile 14px/400
  body2: {
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '19px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '16px',
      lineHeight: '22px',
    },
  },

  // Caption / Body S: desktop 14px/400 → mobile 12px/400
  caption: {
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '16px',
    [baseTheme.breakpoints.up('md')]: {
      fontSize: '14px',
      lineHeight: '19px',
    },
  },

  // Button: 16px/600 (same for both)
  button: {
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '22px',
    textTransform: 'none',
  },

  // Overline for small labels
  overline: {
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '16px',
    textTransform: 'none',
  },
};

// Custom typography variants for component-specific styles
export const componentTypography = {
  // Product card
  productTitle: {
    desktop: { fontWeight: 600, fontSize: '16px', lineHeight: '22px' },
    mobile: { fontWeight: 600, fontSize: '14px', lineHeight: '19px' },
  },
  productSubInfo: {
    desktop: { fontWeight: 400, fontSize: '14px', lineHeight: '19px' },
    mobile: { fontWeight: 400, fontSize: '12px', lineHeight: '16px' },
  },
  price: {
    desktop: { fontWeight: 700, fontSize: '20px', lineHeight: '27px' },
    mobile: { fontWeight: 700, fontSize: '16px', lineHeight: '22px' },
  },
  oldPrice: {
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '19px',
  },
  saleBadge: {
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '16px',
  },

  // Form elements
  inputText: {
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '22px',
  },
  inputLabel: {
    desktop: { fontWeight: 500, fontSize: '14px', lineHeight: '19px' },
    mobile: { fontWeight: 500, fontSize: '12px', lineHeight: '16px' },
  },
  error: {
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '16px',
  },

  // Filters
  filterTitle: {
    desktop: { fontWeight: 600, fontSize: '16px', lineHeight: '22px' },
    mobile: { fontWeight: 600, fontSize: '14px', lineHeight: '19px' },
  },
  sortText: {
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '19px',
  },

  // Buttons
  buttonSmall: {
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '19px',
  },
};
