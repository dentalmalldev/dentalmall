import { Components, Theme, createTheme } from '@mui/material/styles';
import { colors } from './colors';

const baseTheme = createTheme();

export const components: Components<Theme> = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        fontFamily: '"Noto Sans Georgian", sans-serif',
        fontWeight: 500,
        textTransform: 'none',
        borderRadius: '20px',
        // Mobile first
        fontSize: '14px',
        lineHeight: '19px',
        padding: '10px 24px',
        minHeight: '40px',
        [baseTheme.breakpoints.up('md')]: {
          fontSize: '16px',
          lineHeight: '22px',
          minHeight: '48px',
          padding: '14px 24px',
        },
      },
      contained: {
        backgroundColor: colors.accent.main,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: colors.accent.hover,
        },
        '&:active': {
          backgroundColor: colors.accent.pressed,
        },
        '&.Mui-disabled': {
          backgroundColor: colors.accent.disabled,
          color: colors.accent.disabledText,
        },
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: '2px',
        borderColor: colors.accent.main,
        color: colors.text.primary,
        '&:hover': {
          borderWidth: '2px',
          borderColor: colors.accent.hover,
          backgroundColor: 'transparent',
        },
        '&:active': {
          borderColor: colors.accent.pressed,
        },
        '&.Mui-disabled': {
          borderWidth: '2px',
          borderColor: colors.accent.disabled,
          color: colors.accent.disabledText,
        },
      },
      text: {
        color: colors.text.primary,
        '&:hover': {
          backgroundColor: 'transparent',
        },
        '&.Mui-disabled': {
          color: colors.accent.disabledText,
        },
      },
      sizeLarge: {
        minHeight: '48px',
        padding: '14px 24px',
        fontSize: '16px',
        lineHeight: '22px',
      },
      sizeMedium: {
        minHeight: '40px',
        padding: '10px 24px',
        fontSize: '14px',
        lineHeight: '19px',
      },
    },
  },

  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      fullWidth: true,
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        fontFamily: '"Roboto", sans-serif',
        borderRadius: '8px',
        fontSize: '12px',
        minHeight: '40px',
        [baseTheme.breakpoints.up('md')]: {
          fontSize: '16px',
          minHeight: '48px',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.border.mobile,
          [baseTheme.breakpoints.up('md')]: {
            borderColor: colors.border.default,
          },
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.border.focus,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.border.focus,
          borderWidth: '1px',
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.border.error,
        },
      },
      input: {
        padding: '10px 16px',
        '&::placeholder': {
          color: colors.text.placeholder,
          opacity: 1,
        },
      },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontFamily: '"Noto Sans Georgian", sans-serif',
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: '16px',
        color: colors.text.labelMobile,
        [baseTheme.breakpoints.up('md')]: {
          fontSize: '14px',
          lineHeight: '19px',
          color: colors.text.label,
        },
        '&.Mui-focused': {
          color: colors.border.focus,
        },
        '&.Mui-error': {
          color: colors.border.error,
        },
      },
    },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: {
        fontFamily: '"Noto Sans Georgian", sans-serif',
        fontWeight: 400,
        marginTop: '4px',
        fontSize: '10px',
        [baseTheme.breakpoints.up('md')]: {
          fontSize: '12px',
          lineHeight: '16px',
        },
        '&.Mui-error': {
          color: colors.border.error,
        },
      },
    },
  },
};
