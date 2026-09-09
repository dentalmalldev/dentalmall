import { Prisma } from '@prisma/client';

/**
 * Canonical gallery order for product media.
 *
 * The product detail page slides to a variant's image by index, so the order
 * media comes back in has to be the same on every request — an unordered
 * `findMany` gives no such guarantee.
 */
export const MEDIA_ORDER_BY: Prisma.mediaOrderByWithRelationInput[] = [
  { sort_order: 'asc' },
  { created_at: 'asc' },
];
