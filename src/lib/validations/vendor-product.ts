import { z } from 'zod';

// Vendors set the price DentalMall buys at — `dentalmall_price` (product- and
// option-level). The selling `price` and `sale_price` are admin-controlled.
export const vendorUpdateProductPricingSchema = z.object({
  dentalmall_price: z.number().positive('Price must be positive').optional(),
  variant_options: z
    .array(
      z.object({
        id: z.string().min(1),
        dentalmall_price: z.number().positive('Price must be positive').optional(),
      })
    )
    .optional(),
});

export type VendorUpdateProductPricingValues = z.infer<typeof vendorUpdateProductPricingSchema>;
