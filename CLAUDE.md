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
- **Form Validation**: Formik + Zod (backend) + Yup (frontend)
- **Font**: Noto Sans Georgian (primary), Roboto (inputs)

## Folder Structure

```
src/
├── app/
│   ├── [locale]/              # Locale-based routing (ka, en)
│   │   ├── admin/             # Admin pages (login, dashboard, products, orders, vendors, clinics)
│   │   ├── cart/              # Cart page
│   │   ├── categories/        # Category pages
│   │   ├── checkout/          # Checkout flow
│   │   ├── orders/            # User order history
│   │   ├── profile/           # User profile page
│   │   ├── vendors/           # Vendor pages (list, detail)
│   │   ├── vendor-dashboard/  # Vendor dashboard (products, orders)
│   │   └── page.tsx           # Home page
│   └── api/                   # API routes
│       ├── auth/              # Auth endpoints (register, me)
│       ├── admin/             # Admin endpoints (login, products, orders, vendors, clinics)
│       ├── vendor/            # Vendor endpoints (dashboard, products, orders)
│       ├── cart/              # Cart CRUD endpoints
│       ├── orders/            # Order creation
│       ├── products/          # Public product endpoints
│       ├── categories/        # Category endpoints
│       ├── vendors/           # Public vendor endpoints
│       ├── addresses/         # User address endpoints
│       ├── clinic-requests/   # Clinic registration requests
│       ├── vendor-requests/   # Vendor registration requests
│       ├── clinics/           # Clinic profile endpoints
│       └── upload/            # File upload endpoint
├── components/
│   ├── common/                # Shared components
│   │   ├── AuthGuard/         # Protects authenticated routes
│   │   ├── AdminGuard/        # Protects admin routes
│   │   ├── VendorGuard/       # Protects vendor routes
│   │   ├── GuestGuard/        # Redirects authenticated users
│   │   ├── ProductCard/       # Product display card
│   │   └── language-switcher/ # Language toggle
│   ├── layout/                # Layout components
│   │   ├── header/            # Desktop header
│   │   └── bottom-navigation/ # Mobile bottom nav
│   └── sections/              # Page-specific sections
│       ├── auth/              # Login/Register modals
│       ├── admin/             # Admin dashboard, product-management, order management
│       ├── cart/              # Cart components
│       ├── checkout/          # Checkout steps (address, review, confirm)
│       ├── profile/           # Profile components
│       ├── vendor-dashboard/  # Vendor dashboard, products, orders, pricing dialog
│       └── product-detail/    # Product detail page
├── providers/                 # React context providers
│   ├── AuthProvider.tsx       # Firebase auth state
│   ├── CartProvider.tsx       # Cart state management
│   ├── QueryProvider.tsx      # TanStack Query
│   ├── SnackbarProvider.tsx   # Global snackbar notifications
│   └── AuthModalProvider.tsx  # Auth modal state
├── services/                  # API service functions
│   ├── auth.ts                # Auth API calls
│   ├── cart.ts                # Cart API calls
│   └── vendor.ts              # Vendor API calls (VendorProductPricingUpdate)
├── hooks/                     # Custom React hooks
│   ├── useProduct.ts          # Fetch single product
│   └── ...
├── lib/                       # Library configs
│   ├── prisma.ts              # Prisma client (singleton)
│   ├── index.ts               # Re-exports prisma
│   ├── firebase.ts            # Firebase client config
│   ├── firebase-admin.ts      # Firebase admin SDK
│   ├── auth-middleware.ts     # API auth middleware (withAuth)
│   └── validations/           # Zod (backend) + Yup (frontend) schemas
│       ├── product.ts         # Zod + Yup schemas for products & variants
│       ├── vendor-product.ts  # Zod schema for vendor pricing updates
│       └── ...
├── i18n/                      # Internationalization
│   ├── messages/
│   │   ├── en.json
│   │   └── ka.json
│   └── index.ts               # i18n config
├── types/                     # TypeScript types
│   ├── models.ts              # Database model types
│   └── index.ts               # Re-exports types
├── icons/                     # Custom SVG icons
├── theme/                     # MUI theme configuration
└── constants/                 # App constants
```

## Database Schema (Current)

```prisma
enum Role           { USER ADMIN CLINIC VENDOR }
enum AuthProvider   { EMAIL GOOGLE }
enum OrderStatus    { PENDING CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED }
enum PaymentStatus  { PENDING INVOICE_SENT PAID FAILED REFUNDED }
enum ClinicRequestStatus { PENDING APPROVED REJECTED }
enum VendorRequestStatus { PENDING APPROVED REJECTED }

model users {
  id            String   @id @default(cuid())
  firebase_uid  String   @unique
  email         String   @unique
  first_name    String
  last_name     String
  personal_id   String?  @unique
  auth_provider AuthProvider @default(EMAIL)
  role          Role     @default(USER)
  orders        orders[]
  cart_items    cart_items[]
  clinics       clinics[]
  clinic_requests clinic_requests[]
  vendors       vendors[]
  vendor_requests vendor_requests[]
  addresses     addresses[]
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}

model addresses {
  id         String   @id @default(cuid())
  user_id    String
  user       users    @relation(...)
  city       String
  address    String
  is_default Boolean  @default(false)
  orders     orders[]
}

model vendors {
  id                    String     @id @default(cuid())
  user_id               String
  company_name          String
  identification_number String     @unique
  email                 String
  description           String?
  city                  String
  address               String
  phone_number          String
  is_active             Boolean    @default(true)
  products              products[]
}

model vendor_requests {
  id                    String              @id @default(cuid())
  user_id               String
  company_name          String
  identification_number String
  status                VendorRequestStatus @default(PENDING)
  admin_notes           String?
  ...
}

model clinics { ... }
model clinic_requests { ... }

model categories {
  id         String       @id @default(cuid())
  name       String
  name_ka    String
  slug       String       @unique
  image      String?
  parent_id  String?
  parent     categories?  @relation("category_to_category", ...)
  children   categories[] @relation("category_to_category")
  products   products[]
}

model products {
  id               String   @id @default(cuid())
  name             String
  name_ka          String
  description      String?
  description_ka   String?
  manufacturer     String?
  price            Decimal  @db.Decimal(10, 2)
  sale_price       Decimal? @db.Decimal(10, 2)
  discount_percent Int?
  sku              String   @unique
  stock            Int      @default(0)
  category_id      String
  vendor_id        String?
  media            media[]
  variant_types    variant_types[]   # TWO-LEVEL variant system
  order_items      order_items[]
  cart_items       cart_items[]
}

# Two-level variant system:
# variant_types = dimensions (e.g. "Color", "Size")
# variant_options = selectable values with pricing (e.g. "Red", "Large")

model variant_types {
  id         String            @id @default(cuid())
  product_id String
  product    products          @relation(..., onDelete: Cascade)
  name       String
  name_ka    String
  options    variant_options[]
}

model variant_options {
  id               String        @id @default(cuid())
  variant_type_id  String
  variant_type     variant_types @relation(..., onDelete: Cascade)
  name             String
  name_ka          String
  price            Decimal       @db.Decimal(10, 2)
  sale_price       Decimal?      @db.Decimal(10, 2)
  discount_percent Int?
  stock            Int           @default(0)
  cart_items       cart_items[]
  order_items      order_items[]
}

model media {
  id            String   @id @default(cuid())
  url           String
  filename      String
  original_name String
  type          String   @default("image")
  size          Int?
  product_id    String?
  product       products? @relation(..., onDelete: Cascade)
}

model orders {
  id             String        @id @default(cuid())
  order_number   String        @unique
  user_id        String
  address_id     String
  status         OrderStatus   @default(PENDING)
  payment_status PaymentStatus @default(PENDING)
  payment_method String        @default("INVOICE")
  subtotal       Decimal
  discount       Decimal       @default(0)
  delivery_fee   Decimal       @default(0)
  total          Decimal
  notes          String?
  invoice_url    String?
  items          order_items[]
}

model order_items {
  id                String           @id @default(cuid())
  order_id          String
  product_id        String
  variant_option_id String?          # references variant_options (nullable)
  variant_option    variant_options?
  variant_name      String?          # snapshot of variant name at order time
  quantity          Int
  price             Decimal
}

model cart_items {
  id                String           @id @default(cuid())
  user_id           String
  product_id        String
  variant_option_id String?          # references variant_options (nullable)
  variant_option    variant_options?
  quantity          Int              @default(1)
  @@unique([user_id, product_id, variant_option_id])
}
```

## Authentication System

### Roles
- `USER` — regular customer, can buy products
- `ADMIN` — full platform access, manages products/orders/vendors/clinics
- `VENDOR` — can manage their own products and view their orders
- `CLINIC` — clinic account (same shopping as USER, but with clinic identity)

### User Authentication
- Firebase handles auth (email/password + Google)
- User data synced to PostgreSQL via `/api/auth/register`
- `AuthProvider` provides `user` (Firebase) and `dbUser` (database)

### Admin Authentication
- Admin login at `/{locale}/admin/login`
- Verifies Firebase token + checks `role: ADMIN` in database
- `AdminGuard` protects admin routes

### Vendor Authentication
- Vendors register via `/api/vendor-requests` → admin approves → role set to VENDOR
- `VendorGuard` protects vendor dashboard routes
- Vendors can only manage products assigned to their vendor record

### Protected API Routes
```ts
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    // authUser has { uid, email }
    // Look up user: await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } })
    return NextResponse.json({ data });
  });
}
```

## Validation Strategy

- **Backend API routes**: Zod (`safeParse`) — in `src/lib/validations/`
- **Frontend Formik forms**: Yup (`validationSchema` prop) — same files export both

```ts
// src/lib/validations/product.ts exports both:
export const createProductSchema = z.object({ ... });      // Zod for backend
export const createProductYupSchema = yup.object({ ... }); // Yup for frontend
```

## Two-Level Variant System

Products can have multiple variant types (dimensions), each with multiple options (selectable values):

```
Product "Dental Mirror Set"
  └── VariantType "Size" / "ზომა"
        ├── VariantOption "Small" / "პატარა"  — price: ₾10, stock: 5
        └── VariantOption "Large" / "დიდი"    — price: ₾15, stock: 3
  └── VariantType "Color" / "ფერი"
        ├── VariantOption "Blue" / "ლურჯი"    — price: ₾10, stock: 8
        └── VariantOption "Red" / "წითელი"    — price: ₾12, stock: 4
```

- The **product base price** is the default when no variant is selected
- **variant_options** hold their own `price`, `sale_price`, `discount_percent`, `stock`
- `cart_items` and `order_items` reference `variant_option_id` (nullable — null means no variant selected)
- Products requiring a variant selection: `hasVariants = product.variant_types?.some(vt => vt.options.length > 0)`
- The add-to-cart button is disabled until a variant is selected when `hasVariants` is true

## Providers

Wrap order in `[locale]/layout.tsx`:
```tsx
<AuthProvider>
  <CartProvider>
    <QueryProvider>
      <SnackbarProvider>
        <AuthModalProvider>
          {children}
        </AuthModalProvider>
      </SnackbarProvider>
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
// addToCart(productId, quantity, variantOptionId?)
```

### useSnackbar Hook
```ts
const { showSnackbar } = useSnackbar();
showSnackbar('Item added to cart');
```

### useAuthModal Hook
```ts
const { openAuthModal } = useAuthModal();
// Opens login/register modal for unauthenticated actions
```

## Internationalization (i18n)

### Using translations
```tsx
import { useTranslations, useLocale } from 'next-intl';

function Component() {
  const t = useTranslations('productDetail');
  const locale = useLocale();
  return <Typography>{t('addToCart')}</Typography>;
}
```

### Adding translations
Add to both `src/i18n/messages/en.json` and `ka.json`:
```json
{
  "productDetail": {
    "addToCart": "Add to Cart"
  }
}
```

**Important:** Always use `useTranslations` hook. Never hardcode text strings.

## API Routes

### Auth
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Create/update user in DB after Firebase signup |
| `/api/auth/me` | GET | Yes | Get current user info |

### Products (Public)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/products` | GET | No | List products (with pagination, search, category filter) |
| `/api/products/[id]` | GET | No | Get product by ID (includes variant_types → options, media, category, vendor) |
| `/api/products/[id]` | PATCH | No | Update product (admin/internal use) |
| `/api/products/[id]` | DELETE | No | Delete product |

### Admin
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/login` | POST | Yes | Verify ADMIN role |
| `/api/admin/products` | GET | Yes (ADMIN) | List all products |
| `/api/admin/products` | POST | Yes (ADMIN) | Create product with variant_types + options |
| `/api/admin/products/[id]` | PUT | Yes (ADMIN) | Update product + upsert variant_types/options |
| `/api/admin/products/[id]` | DELETE | Yes (ADMIN) | Delete product |
| `/api/admin/orders` | GET | Yes (ADMIN) | List all orders |
| `/api/admin/orders/[id]` | PATCH | Yes (ADMIN) | Update order status |
| `/api/admin/vendors` | GET | Yes (ADMIN) | List all vendors |
| `/api/admin/vendor-requests` | GET | Yes (ADMIN) | List vendor registration requests |
| `/api/admin/vendor-requests/[id]` | PATCH | Yes (ADMIN) | Approve/reject vendor request |
| `/api/admin/clinic-requests` | GET | Yes (ADMIN) | List clinic registration requests |
| `/api/admin/clinic-requests/[id]` | PATCH | Yes (ADMIN) | Approve/reject clinic request |

### Vendor
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/vendor/dashboard` | GET | Yes (VENDOR) | Dashboard stats for vendor |
| `/api/vendor/products` | GET | Yes (VENDOR) | List vendor's own products |
| `/api/vendor/products/[id]` | PATCH | Yes (VENDOR) | Update product pricing only (price, sale_price, discount_percent, variant_options pricing) |
| `/api/vendor/orders` | GET | Yes (VENDOR) | List orders containing vendor's products |

### Cart
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cart` | GET | Yes | Get user's cart (includes product.variant_types.options, variant_option) |
| `/api/cart` | POST | Yes | Add item to cart (`product_id`, `quantity`, `variant_option_id?`) |
| `/api/cart` | DELETE | Yes | Clear entire cart |
| `/api/cart/[id]` | PUT | Yes | Update item quantity |
| `/api/cart/[id]` | DELETE | Yes | Remove item from cart |

### Orders
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/orders` | GET | Yes | Get user's order history |
| `/api/orders` | POST | Yes | Create order from cart (requires `address_id`, `notes?`) |

### Addresses
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/addresses` | GET | Yes | List user addresses |
| `/api/addresses` | POST | Yes | Create address |
| `/api/addresses/[id]` | PUT | Yes | Update address |
| `/api/addresses/[id]` | DELETE | Yes | Delete address |

### Categories
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/categories` | GET | No | List categories (with parent/children) |
| `/api/categories/[id]` | GET | No | Get category by ID |

### Vendors (Public)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/vendors` | GET | No | List active vendors |
| `/api/vendors/[id]` | GET | No | Get vendor by ID with products |

### Requests
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/vendor-requests` | POST | Yes | Submit vendor registration request |
| `/api/clinic-requests` | POST | Yes | Submit clinic registration request |
| `/api/clinics` | GET | Yes | Get current user's clinic info |

### Upload
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/upload` | POST | Yes (ADMIN) | Upload media files, returns `{ url, filename }` |

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

// Require vendor role
<VendorGuard>
  <VendorDashboard />
</VendorGuard>

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
import { useAuth, useCart, useSnackbar, useAuthModal } from '@/providers';

// Components
import { AuthGuard, AdminGuard, VendorGuard, ProductCard } from '@/components/common';
import { Header } from '@/components/layout';

// Services
import { authService } from '@/services/auth';
import { cartService } from '@/services/cart';
import { vendorService, VendorProductPricingUpdate } from '@/services/vendor';

// Types
import { Product, CartItem, VariantType, VariantOption, Order } from '@/types/models';
import { Product, CartItem } from '@/types'; // re-exports from models

// Lib
import { prisma } from '@/lib';

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
npx prisma migrate dev   # Run migrations (run after schema changes)
npx prisma generate      # Regenerate Prisma client (run after schema changes)
npx prisma studio        # Open Prisma GUI
```

## Important Notes

- Always use `useTranslations` for text, never hardcode strings
- Types go in `src/types/models.ts`, not in service files
- Protected routes use `withAuth` middleware
- Admin routes require both Firebase auth AND `role: ADMIN` in DB
- Vendor routes require `role: VENDOR` and product must belong to vendor's `vendor_id`
- Cart persists to database for logged-in users
- Mobile has bottom navigation, desktop has header
- Admin pages hide bottom navigation
- Locale prefix required in all routes: `/{locale}/page`
- Product `price`/`sale_price` are stored as `Decimal` in DB, always `parseFloat()` before arithmetic
- Variant pricing: `variant_options` have their own `price`/`sale_price`/`discount_percent` — override the product-level price when selected
- After any Prisma schema change: run BOTH `npx prisma migrate dev` AND `npx prisma generate`

## Making a User Admin/Vendor/Clinic

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
UPDATE users SET role = 'VENDOR' WHERE email = 'vendor@example.com';
```

Or via Prisma Studio: `npx prisma studio`
