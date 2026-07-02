/**
 * Delivery fee — single source of truth. Applied per order (each split order is
 * calculated independently from its own subtotal).
 *
 *   subtotal < 500 ₾  → flat 30 ₾
 *   subtotal ≥ 500 ₾  → 2% of subtotal
 *
 * All fee math must go through here (cart preview, checkout, order creation,
 * invoice) so the value never drifts. Server-side is authoritative.
 */

export const DELIVERY_FEE_FLAT = 30;
export const DELIVERY_FEE_THRESHOLD = 500;
export const DELIVERY_FEE_RATE = 0.02;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Fee for a single order's subtotal (the product total the customer pays). */
export function calculateDeliveryFee(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (subtotal < DELIVERY_FEE_THRESHOLD) return DELIVERY_FEE_FLAT;
  return round2(subtotal * DELIVERY_FEE_RATE);
}

export interface DeliveryFeeEncouragement {
  /** How much more product spend is needed to reach the 500 ₾ threshold. */
  amountToThreshold: number;
  /** Current (flat) fee. */
  currentFee: number;
  /** Fee once the threshold is reached. */
  thresholdFee: number;
}

/**
 * Encouragement details shown when a subtotal is under the threshold — or null
 * when the customer already qualifies for the percentage-based fee.
 */
export function getDeliveryFeeEncouragement(subtotal: number): DeliveryFeeEncouragement | null {
  if (subtotal <= 0 || subtotal >= DELIVERY_FEE_THRESHOLD) return null;
  return {
    amountToThreshold: round2(DELIVERY_FEE_THRESHOLD - subtotal),
    currentFee: DELIVERY_FEE_FLAT,
    thresholdFee: calculateDeliveryFee(DELIVERY_FEE_THRESHOLD),
  };
}
