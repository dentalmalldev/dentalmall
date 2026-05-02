import type { Metadata } from 'next';
import { CartContent } from "@/components/sections";

export const metadata: Metadata = {
  title: 'Cart',
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartContent />;
}
