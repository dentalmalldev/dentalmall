# DentalMall Project Instructions

## Project Overview
Next.js 16 e-commerce application for dental products with Material UI 7 theming.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: Material UI 7
- **Styling**: Emotion (CSS-in-JS)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma 7
- **Authentication**: Firebase Auth (client + admin SDK)
- **State Management**: TanStack Query (React Query)
- **Internationalization**: next-intl (Georgian + English)
- **Form Validation**: Formik + Zod
- **Font**: Noto Sans Georgian (primary), Roboto (inputs)

## Folder Structure

```
src/
├── app/
│   ├── [locale]/              # Locale-based routing (ka, en)
│   │   ├── admin/             # Admin pages (login, dashboard)
│   │   ├── cart/              # Cart page
│   │   ├── categories/        # Category pages
│   │   ├── profile/           # User profile page
│   │   └── page.tsx           # Home page
│   └── api/                   # API routes
│       ├── auth/              # Auth endpoints (register, me)
│       ├── admin/             # Admin endpoints (login)
│       └── cart/              # Cart CRUD endpoints
├── components/
│   ├── common/                # Shared components
│   │   ├── AuthGuard/         # Protects authenticated routes
│   │   ├── AdminGuard/        # Protects admin routes
│   │   ├── GuestGuard/        # Redirects authenticated users
│   │   ├── ProductCard/       # Product display card
│   │   └── language-switcher/ # Language toggle
│   ├── layout/                # Layout components
│   │   ├── header/            # Desktop header
│   │   └── bottom-navigation/ # Mobile bottom nav
│   └── sections/              # Page-specific sections
│       ├── auth/              # Login/Register modals
│       ├── admin/             # Admin login/dashboard
│       ├── cart/              # Cart components
│       └── profile/           # Profile components
├── providers/                 # React context providers
│   ├── AuthProvider.tsx       # Firebase auth state
│   ├── CartProvider.tsx       # Cart state management
│   └── QueryProvider.tsx      # TanStack Query
├── services/                  # API service functions
│   ├── auth.ts                # Auth API calls
│   └── cart.ts                # Cart API calls
├── lib/                       # Library configs
│   ├── prisma.ts              # Prisma client
│   ├── firebase.ts            # Firebase client config
│   ├── firebase-admin.ts      # Firebase admin SDK
│   ├── auth-middleware.ts     # API auth middleware
│   └── validations/           # Zod schemas
├── i18n/                      # Internationalization
│   ├── messages/              # Translation JSON files
│   │   ├── en.json
│   │   └── ka.json
│   └── index.ts               # i18n config
├── types/                     # TypeScript types
│   └── models.ts              # Database model types
├── icons/                     # Custom SVG icons
├── theme/                     # MUI theme configuration
└── constants/                 # App constants
```

## Database Schema (Prisma)

```prisma
enum Role {
  USER
  ADMIN
}

model users {
  id            String   @id @default(cuid())
  firebase_uid  String   @unique
  email         String   @unique
  first_name    String
  last_name     String
  personal_id   String?  @unique
  auth_provider AuthProvider @default(EMAIL)
  role          Role     @default(USER)
  cart_items    cart_items[]
  orders        orders[]
}

model products {
  id           String   @id @default(cuid())
  name         String
  name_ka      String
  price        Decimal
  sale_price   Decimal?
  manufacturer String?
  images       String[]
  stock        Int
  category_id  String
  cart_items   cart_items[]
}

model cart_items {
  id         String @id @default(cuid())
  user_id    String
  product_id String
  quantity   Int    @default(1)
  @@unique([user_id, product_id])
}
```

## Authentication System

### User Authentication
- Firebase handles auth (email/password + Google)
- User data synced to PostgreSQL via `/api/auth/register`
- `AuthProvider` provides `user` (Firebase) and `dbUser` (database)

### Admin Authentication
- Admin login at `/{locale}/admin/login`
- Verifies Firebase token + checks `role: ADMIN` in database
- `AdminGuard` protects admin routes

### Protected API Routes
```ts
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    // authUser has { uid, email }
    return NextResponse.json({ data });
  });
}
```

## Providers

Wrap order in `[locale]/layout.tsx`:
```tsx
<AuthProvider>
  <CartProvider>
    <QueryProvider>
      {children}
    </QueryProvider>
  </CartProvider>
</AuthProvider>
```

### useAuth Hook
```ts
const { user, dbUser, loading, login, register, logout, loginWithGoogle } = useAuth();
```

### useCart Hook
```ts
const { items, itemCount, subtotal, total, addToCart, removeFromCart, updateQuantity } = useCart();
```

## Internationalization (i18n)

### Using translations
```tsx
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('profile');
  return <Typography>{t('myInfo')}</Typography>;
}
```

### Adding translations
Add to both `src/i18n/messages/en.json` and `ka.json`:
```json
{
  "profile": {
    "myInfo": "My Information",
    "save": "Save"
  }
}
```

**Important:** Always use `useTranslations` hook. Never hardcode text strings.

## API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Create/update user in DB |
| `/api/auth/me` | GET | Yes | Get current user info |
| `/api/admin/login` | POST | Yes | Verify admin access |
| `/api/cart` | GET | Yes | Get user's cart |
| `/api/cart` | POST | Yes | Add item to cart |
| `/api/cart` | DELETE | Yes | Clear cart |
| `/api/cart/[id]` | PUT | Yes | Update item quantity |
| `/api/cart/[id]` | DELETE | Yes | Remove item |

## Guards

```tsx
// Require authenticated user with DB record
<AuthGuard requireDbUser={true}>
  <ProfileContent />
</AuthGuard>

// Require admin role
<AdminGuard>
  <AdminDashboard />
</AdminGuard>

// Redirect logged-in users (for login page)
<GuestGuard>
  <LoginPage />
</GuestGuard>
```

## Theme System

### Colors
```ts
colors.primary[70]        // #01DBE6 - Main cyan
colors.secondary[40]      // #9292FF - Main purple
colors.accent.main        // #5B6ECD - Button primary
colors.accent.hover       // #4A5BC0
colors.text.primary       // #2C2957 - Main text
```

### Button Variants
```tsx
<Button variant="contained">Primary</Button>
<Button variant="outlined">Secondary</Button>
<Button variant="text">Tertiary</Button>
```

## Import Patterns

```tsx
// Providers
import { useAuth, useCart } from '@/providers';

// Components
import { AuthGuard, AdminGuard, ProductCard } from '@/components/common';
import { Header } from '@/components/layout';

// Services
import { authService } from '@/services/auth';
import { cartService } from '@/services/cart';

// Types
import { CartItem, CartProduct, DbUser } from '@/types/models';

// Theme
import { colors } from '@/theme';

// i18n
import { useTranslations, useLocale } from 'next-intl';
```

## Component Creation Pattern

```
components/common/NewComponent/
├── NewComponent.tsx
└── index.ts
```

Then export from `components/common/index.ts`.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma GUI
```

## Important Notes

- Always use `useTranslations` for text, never hardcode
- Types go in `src/types/`, not in service files
- Protected routes use `withAuth` middleware
- Admin routes require both Firebase auth AND `role: ADMIN` in DB
- Cart persists to database for logged-in users
- Mobile has bottom navigation, desktop has header
- Admin pages hide bottom navigation
- Locale prefix required in all routes: `/{locale}/page`

## Making a User Admin

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Or via Prisma Studio: `npx prisma studio`
