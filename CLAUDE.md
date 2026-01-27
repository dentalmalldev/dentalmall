# DentalMall Project Instructions

## Project Overview
Next.js 16 e-commerce application for dental products with Material UI 7 theming.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: Material UI 7
- **Styling**: Emotion (CSS-in-JS)
- **Language**: TypeScript
- **Font**: Noto Sans Georgian (primary), Roboto (inputs)

## Folder Structure

```
src/
├── app/                    # Next.js App Router (pages)
├── components/
│   ├── common/            # Shared components (Button, Card, Modal)
│   ├── layout/            # Layout components (Header, Footer, Sidebar)
│   ├── forms/             # Form components (FormInput, FormSelect)
│   └── index.ts
├── icons/                 # Custom SVG icons
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── types/                 # TypeScript types/interfaces
├── constants/             # App constants, routes, API endpoints
├── services/              # API services
├── lib/                   # Third-party library configs
└── theme/                 # MUI theme configuration
    ├── colors.ts          # Color palette
    ├── typography.ts      # Typography variants
    ├── components.ts      # MUI component overrides
    ├── theme.ts           # Main theme (combines all)
    ├── ThemeProvider.tsx  # Client-side provider
    └── index.ts           # Exports
```

## Theme System

### Colors (`@/theme` → `colors`)

```ts
colors.primary[70]        // #01DBE6 - Main cyan
colors.secondary[40]      // #9292FF - Main purple
colors.accent.main        // #5B6ECD - Button primary
colors.accent.hover       // #4A5BC0
colors.accent.pressed     // #3C4CA8
colors.accent.disabled    // #D8DCEF
colors.text.primary       // #2C2957 - Main text
colors.text.placeholder   // #A8B0BA
colors.border.default     // #D6D9DE - Input border
colors.border.focus       // #42428A - Input focus
colors.border.error       // #DC2626 - Error state
```

**Color Scales:**
- Primary (Cyan): 100-10 shades (#00666C → #E8FEFF)
- Secondary (Purple): 100-10 shades (#222250 → #F4F4FF)

### Typography

MUI variants with responsive sizing (mobile-first):

| Variant | Desktop | Mobile |
|---------|---------|--------|
| h1 | 36px/900 | 32px/800 |
| h2 | 36px/700 | 28px/600 |
| h3 | 32px/600 | 24px/600 |
| h4 | 24px/600 | 20px/600 |
| h5 | 20px/600 | 18px/600 |
| h6 | 18px/600 | 16px/600 |
| body1 | 18px/400 | 16px/400 |
| body2 | 16px/400 | 14px/400 |
| caption | 14px/400 | 12px/400 |

### Buttons

Three variants with states:

```tsx
// Primary (filled)
<Button variant="contained">შესვლა</Button>

// Secondary (outlined)
<Button variant="outlined">გაუქმება</Button>

// Tertiary (text only)
<Button variant="text">დაბრუნება</Button>

// Sizes
<Button size="large">Desktop (48px)</Button>
<Button size="medium">Mobile (40px)</Button>
```

**Button States:**
- Default: `#5B6ECD`
- Hover: `#4A5BC0`
- Pressed: `#3C4CA8`
- Disabled: bg `#D8DCEF`, text `#9EA3B5`

### Inputs

```tsx
// Basic input
<TextField label="სახელი" placeholder="შეიყვანეთ სახელი" />

// With error
<TextField
  label="ელ-ფოსტა"
  error
  helperText="ელ-ფოსტა არასწორია*"
/>

// Password with toggle
<TextField
  label="პაროლი"
  type="password"
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton>
          <VisibilityOff />
        </IconButton>
      </InputAdornment>
    )
  }}
/>
```

**Input States:**
- Default border: `#D6D9DE`
- Focus border: `#42428A`
- Error border: `#DC2626`

## Import Patterns

```tsx
// Theme
import { colors, theme, typography } from '@/theme';

// Components (when created)
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/common';
import { FormInput } from '@/components/forms';

// Other
import { useAuth } from '@/hooks';
import { formatPrice } from '@/utils';
import { ROUTES, APP_NAME } from '@/constants';
import { LogoIcon } from '@/icons';
```

## Component Creation Pattern

When creating new components, follow this structure:

```
components/common/Button/
├── Button.tsx           # Main component
├── Button.types.ts      # TypeScript interfaces (optional)
└── index.ts             # Export: export { Button } from './Button';
```

Then add to parent index:
```ts
// components/common/index.ts
export { Button } from './Button';
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Notes

- All components use `'use client'` directive when needed for client-side features
- Theme is provided via `ThemeProvider` in `app/layout.tsx`
- MUI cache provider (`AppRouterCacheProvider`) handles SSR styling
- Path alias `@/*` maps to `./src/*`
- Georgian language is primary (font: Noto Sans Georgian)
