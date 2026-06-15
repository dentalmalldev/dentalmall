import { prisma } from '@/lib';
import { uploadToStorage } from '@/lib/firebase-admin';
import { generateInvoicePDF } from '@/lib/email/templates/invoice-pdf';
import { InvoiceData } from '@/types/models';

// Order shape this helper needs. Matches the include used below.
type OrderForInvoice = {
  id: string;
  order_number: string;
  subtotal: unknown;
  discount: unknown;
  delivery_fee: unknown;
  total: unknown;
  payment_method: string;
  created_at: Date;
  user: { first_name: string; last_name: string; email: string };
  address: {
    recipient_name: string;
    mobile_number: string;
    city: string;
    address: string;
    postal_code: string | null;
  };
  items: {
    quantity: number;
    price: unknown;
    variant_name: string | null;
    product: { name: string };
  }[];
};

/** Build the InvoiceData payload from a loaded order. */
export function buildInvoiceData(order: OrderForInvoice): InvoiceData {
  return {
    orderNumber: order.order_number,
    customerName: `${order.user.first_name} ${order.user.last_name}`,
    customerEmail: order.user.email,
    address: {
      recipient_name: order.address.recipient_name,
      mobile_number: order.address.mobile_number,
      city: order.address.city,
      address: order.address.address,
      postal_code: order.address.postal_code,
    },
    items: order.items.map((item) => ({
      name: item.product.name,
      variantName: item.variant_name || undefined,
      quantity: item.quantity,
      price: parseFloat(String(item.price)),
      total: parseFloat(String(item.price)) * item.quantity,
    })),
    subtotal: parseFloat(String(order.subtotal)),
    discount: parseFloat(String(order.discount)),
    deliveryFee: parseFloat(String(order.delivery_fee)),
    total: parseFloat(String(order.total)),
    orderDate: new Date(order.created_at).toLocaleDateString('ka-GE'),
    paymentMethod: order.payment_method,
  };
}

/**
 * Generate an invoice PDF for an order, upload it, and persist `invoice_url`.
 * Reuses the existing invoice format so the document matches the in-stock flow.
 * Returns the uploaded URL, or null if generation/upload fails (non-blocking).
 */
export async function generateAndStoreOrderInvoice(orderId: string): Promise<string | null> {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { first_name: true, last_name: true, email: true } },
      address: true,
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) return null;

  const invoiceData = buildInvoiceData(order as unknown as OrderForInvoice);

  try {
    const pdfBuffer = await generateInvoicePDF(invoiceData);
    const pdfFilename = `invoices/invoice-${order.order_number}.pdf`;
    const invoiceUrl = await uploadToStorage(pdfBuffer, pdfFilename, 'application/pdf');
    await prisma.orders.update({
      where: { id: order.id },
      data: { invoice_url: invoiceUrl },
    });
    return invoiceUrl;
  } catch (error) {
    console.error(`Failed to generate/upload invoice for order ${order.order_number}:`, error);
    return null;
  }
}
