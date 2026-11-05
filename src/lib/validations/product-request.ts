import { z } from "zod";

export const MAX_PRODUCTS_PER_REQUEST = 30;
export const MAX_REQUESTS_PER_HOUR = 20;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_SHORT_TEXT_LENGTH = 200;
export const MAX_QUANTITY = 100000;
export const MAX_ADMIN_NOTE_LENGTH = 2000;
export const MAX_PHOTO_SIZE_MB = 25;
export const MAX_PHOTO_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* ---------------- PHONE ---------------- */

export function normalizePhoneNumber(value: string): string {
  return value.replace(/[\s().-]/g, "");
}

/** 9 digits for a Georgian number, up to 15 with a country code. */
export function isValidPhoneNumber(value: string): boolean {
  return /^\+?\d{9,15}$/.test(normalizePhoneNumber(value));
}

export const phoneNumberZodSchema = z
  .string()
  .refine(isValidPhoneNumber, "validation.invalidPhone")
  .transform(normalizePhoneNumber);

/* ---------------- CREATE REQUEST ---------------- */

export const productRequestItemZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(MAX_SHORT_TEXT_LENGTH, "validation.tooLong"),
  invoice_name: z
    .string()
    .trim()
    .max(MAX_SHORT_TEXT_LENGTH, "validation.tooLong")
    .nullish(),
  description: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(MAX_DESCRIPTION_LENGTH, "validation.tooLong"),
  estimated_price: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(MAX_SHORT_TEXT_LENGTH, "validation.tooLong"),
  store: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(MAX_SHORT_TEXT_LENGTH, "validation.tooLong"),
  photo_url: z.string().url().nullish(),
  quantity: z
    .number("validation.required")
    .int("validation.invalidQuantity")
    .min(1, "validation.invalidQuantity")
    .max(MAX_QUANTITY, "validation.invalidQuantity"),
});

export const createProductRequestZodSchema = z.object({
  phone_number: phoneNumberZodSchema.optional(),
  items: z.array(productRequestItemZodSchema).min(1).max(MAX_PRODUCTS_PER_REQUEST),
});

export type ProductRequestItemInput = z.infer<typeof productRequestItemZodSchema>;

/* ---------------- ADMIN ---------------- */

export const PRODUCT_REQUEST_STATUSES = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"] as const;
export type ProductRequestStatusValue = (typeof PRODUCT_REQUEST_STATUSES)[number];

/** NEW → IN_PROGRESS → DONE / REJECTED. The last two are final. */
export const PRODUCT_REQUEST_TRANSITIONS: Record<ProductRequestStatusValue, ProductRequestStatusValue[]> = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE", "REJECTED"],
  DONE: [],
  REJECTED: [],
};

export const adminProductRequestFilterZodSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).optional(),
  status: z.enum(PRODUCT_REQUEST_STATUSES).optional(),
  date_from: z.iso.datetime().optional(),
  date_to: z.iso.datetime().optional(),
});

export const updateProductRequestItemZodSchema = z
  .object({
    status: z.enum(PRODUCT_REQUEST_STATUSES).optional(),
    admin_note: z.string().trim().max(MAX_ADMIN_NOTE_LENGTH).nullable().optional(),
  })
  .refine((data) => data.status !== undefined || data.admin_note !== undefined);
