# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DentalMall — a Next.js 16 (App Router) e-commerce marketplace for dental products, in Georgian (`ka`, default) and English (`en`). Built with MUI 7 + Emotion, Prisma 7 on PostgreSQL, Firebase Auth + Firebase Storage, TanStack Query, next-intl, Formik.

## Commands

```bash
npm run dev                  # dev server
npm run build                # next build, then prisma generate
npm run lint                 # eslint (flat config, eslint-config-next)
npx tsc --noEmit             # type-check (no dedicated script)
npx prisma migrate dev       # after schema changes: run BOTH migrate dev...
npx prisma generate          # ...and generate
npx prisma db seed           # runs prisma/seed.ts via tsx (configured in prisma.config.ts)
npx prisma studio
node scripts/normalize-manufacturers.mjs --dry   # one-off data scripts; --dry previews
```

There is no test suite. Verify changes with `npx tsc --noEmit`, `npm run lint`, and by running the app.

Env vars are listed in `.env.example`: `DATABASE_URL`, Firebase client (`NEXT_PUBLIC_FIREBASE_*`), Firebase admin (`FIREBASE_ADMIN_*`), SMTP (`SMTP_*`, used by nodemailer for invoice/status emails).

## Architecture

### Routing and i18n
- Every page lives under `src/app/[locale]/`. `src/middleware.ts` (next-intl) enforces `localePrefix: 'always'` and skips `/api`. Locales and default are set in `src/i18n/config.ts`.
- Messages are in `src/i18n/messages/{en,ka}.json`. Add every key to both files. Use `useTranslations`; never hardcode UI strings.
- Provider nesting is in `src/app/[locale]/layout.tsx`: LocaleProvider → NextIntlClientProvider → AuthProvider → CartProvider → QueryProvider → AppRouterCacheProvider → ThemeProvider → SnackbarProvider → AuthModalProvider. Hooks (`useAuth`, `useCart`, `useSnackbar`, `useAuthModal`) are exported from `@/providers`.
- Pages are thin. The UI lives in `src/components/sections/<area>/`, and shared pieces live in `src/components/common/<Name>/` (each with an `index.ts`, re-exported from `components/common/index.ts`).

### Auth and roles
- Roles: `USER`, `CLINIC`, `VENDOR`, `ADMIN`, `ACCOUNTANT`, `STORAGE`. Firebase handles identity. The Postgres `users` row (linked by `firebase_uid`) holds the role. `AuthProvider` exposes both `user` (Firebase) and `dbUser`.
- Client → API: services and components call `user.getIdToken()` and send `Authorization: Bearer <token>`. `src/services/api.ts` is an unauthenticated fetcher for public data only.
- Server: `withAuth(request, (req, authUser) => ...)` from `@/lib` only verifies the Firebase token. **The role check is manual in each route**: look up `prisma.users.findUnique({ where: { firebase_uid: authUser.uid } })`, then return 403 if `role` doesn't match. There is no shared role middleware, so copy the pattern from a sibling route.
- Each back-office area has its own login page, layout, and guard: `/admin` (`AdminGuard`), `/accountant` (`AccountantGuard`), `/storage` (`StorageGuard`), and `/vendor-dashboard` (`VendorGuard`). Its API lives at `/api/admin|accountant|storage|vendor`. Vendor routes must also check that the product's `vendor_id` belongs to the caller.
- Users become VENDOR or CLINIC through `vendor_requests` / `clinic_requests`, which an admin approves. Other roles are set directly in the DB (`UPDATE users SET role = 'ADMIN' WHERE email = ...`).

### Pricing model (read before touching prices)
- `products` and `variant_options` each have `price` (selling price the customer pays), `sale_price`, and **`dentalmall_price` (cost price, admin/vendor only)**.
- `dentalmall_price` must never reach a public response. Public routes pass their payload through `stripCostPrices()` (`src/lib/products/publicPricing.ts`) right before `NextResponse.json`. Do the same in any new public endpoint.
- Vendors can edit **only** `dentalmall_price` (`src/lib/validations/vendor-product.ts`). Admins control selling `price` and `sale_price`.
- Display price is `sale_price ?? price`. When a product has variants, variant prices replace the product price. Use `getProductDisplayPricing` / `hasProductVariants` in `src/lib/product-pricing.ts` rather than recomputing. Prisma `Decimal`s arrive as strings, so `parseFloat()` them before doing arithmetic.
- The delivery fee comes only from `src/lib/pricing/calculateDeliveryFee.ts` (under 500 ₾ → flat 30 ₾; otherwise 2%). It is applied per order, and the server value is authoritative. `orders.service_fee` is currently always written as 0.

### Variants and media
- Two-level variants: `variant_types` (dimension, e.g. Size) → `variant_options` (value with its own `sku`, prices, stock). `cart_items` / `order_items` reference a nullable `variant_option_id`. `order_items.variant_name` is a snapshot taken at order time.
- `media` rows belong to a product gallery. They can also be tagged with a `variant_option_id` (`onDelete: SetNull`), which makes the detail page slide to that image. `sort_order` keeps slide indexes stable. Upload goes through `/api/upload` (sharp processing in `lib/images`, then Firebase Storage via `uploadBuffer`), and it checks that a tagged option belongs to the product.

### Vendor visibility
- A vendor has two switches. `is_active` fully disables the account and blocks product assignment. `is_published` hides a newly approved store from the public site until it is published.
- Any public product or vendor query must use `PUBLIC_PRODUCT_WHERE` / `PUBLIC_VENDOR_WHERE` / `isProductHidden` from `src/lib/vendors/visibility.ts`. Platform-owned products have `vendor_id: null` and are always visible.

### Order lifecycle
`POST /api/orders` turns the cart into orders:
- Items are split by `products.in_storage_stock`. A cart that mixes warehouse stock with special-order items becomes **two orders sharing an `order_group_id`**. Each order gets its own delivery fee, invoice PDF (`pdf-lib`), and invoice email.
- In-stock path: `PENDING` → accountant verifies payment (`/api/accountant/orders/[id]/verify-payment` sets `payment_status: PAID`, `status: PROCESSING`) → storage `prepare` (`READY_FOR_DELIVERY`) → `ship` (`OUT_FOR_DELIVERY`) → `deliver` (`DELIVERED`).
- Special-order path: `AWAITING_ADMIN_CONFIRMATION`, hidden from the accountant queue until an admin either confirms availability (`CONFIRMED_PENDING_PAYMENT`, which issues a second invoice and then joins the accountant flow) or cancels it (`CANCELLED_UNAVAILABLE`).
- Each transition route checks the current status before changing it, and sends a status email built from `lib/email/templates/order-status.ts`.

### Admin product tooling
Bulk upload (Excel → `lib/excel/parseProductTemplate.ts`, preview then `/commit`), bulk edit, and bulk delete all share `buildAdminProductWhere` (`src/lib/admin/product-filter-query.ts`). That way, "select all matching" targets exactly the rows the admin sees. Excel export is built **client-side** on purpose, to avoid Vercel function time limits.

### Marketing sources
`?source=<slug>` links are captured by `SourceTracker` and stored on `users.source` at registration. The admin-managed `marketing_sources` table maps slugs to names.

## Conventions
- Validation: Zod with `safeParse` in API routes, and Yup for Formik `validationSchema`. Both are exported from the same file in `src/lib/validations/`.
- Shared model types go in `src/types/models.ts` (re-exported from `@/types`), not in service files.
- `@/lib` re-exports prisma, `withAuth`, and storage helpers. Server-only modules (firebase-admin, prisma) must not be imported into client components.
- Theme tokens come from `@/theme` (`colors.accent.main` for primary buttons, `colors.text.primary` for main text). Noto Sans Georgian is the primary font.
- Mobile uses a bottom navigation and desktop uses the header. Back-office pages hide the bottom navigation.
