import { z } from 'zod';

// Validates/normalizes the admin product-list filter query params.
// Used by GET /api/admin/products to build the Prisma where-clause.
export const adminProductFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Item name search — matched (case-insensitive) against name, name_ka and sku.
  search: z.string().trim().optional(),
  // Single parent/leaf category. When set without a subcategory the backend
  // expands it to include all of its child categories.
  category: z.string().trim().optional(),
  // Specific subcategory — takes precedence over category when present.
  subcategory: z.string().trim().optional(),
  // Comma-separated list of vendor ids (multi-select).
  vendor: z
    .string()
    .trim()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    ),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type AdminProductFilter = z.infer<typeof adminProductFilterSchema>;

// Parse raw URLSearchParams into a validated filter object. Invalid/empty
// values are dropped rather than throwing so the list stays resilient.
export function parseAdminProductFilter(searchParams: URLSearchParams): AdminProductFilter {
  const raw: Record<string, string> = {};
  for (const key of ['page', 'limit', 'search', 'category', 'subcategory', 'vendor', 'minPrice', 'maxPrice']) {
    const value = searchParams.get(key);
    if (value !== null && value !== '') raw[key] = value;
  }
  return adminProductFilterSchema.parse(raw);
}
