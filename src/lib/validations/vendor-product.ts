import { z } from 'zod';

// Vendors can only edit their own cost price (both at product- and variant-level).
// DentalMall (customer-facing) price and sale price are admin-controlled.
export const vendorUpdateProductPricingSchema = z.object({
  price: z.number().positive('Price must be positive').optional(),
  variant_options: z
    .array(
      z.object({
        id: z.string().min(1),
        price: z.number().positive('Price must be positive').optional(),
      })
    )
    .optional(),
});

export type VendorUpdateProductPricingValues = z.infer<typeof vendorUpdateProductPricingSchema>;
