import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { z } from 'zod';
import { withAuth, prisma } from '@/lib';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateInvoiceEmail } from '@/lib/email/templates/invoice';
import { generateOrderInvoice, invoiceStoragePath } from '@/lib/invoice/generateInvoice';

const generateInvoiceSchema = z.object({
  send_email: z.boolean().optional().default(false),
});

async function requireAdmin(uid: string) {
  const adminUser = await prisma.users.findUnique({ where: { firebase_uid: uid } });
  return adminUser && adminUser.role === 'ADMIN' ? adminUser : null;
}

// POST - Generate (or regenerate) the order's invoice PDF from its current data.
// Optionally emails it to the customer.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await requireAdmin(authUser.uid);
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { id } = await params;
      const body = await req.json().catch(() => ({}));
      const parsed = generateInvoiceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }

      const order = await prisma.orders.findUnique({
        where: { id },
        select: { id: true, order_number: true, user_id: true },
      });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const { invoiceUrl, invoiceData } = await generateOrderInvoice(order.id);

      let emailSent = false;
      if (parsed.data.send_email) {
        const { html, text } = generateInvoiceEmail(invoiceData, invoiceUrl);
        emailSent = await sendEmail({
          to: invoiceData.customerEmail,
          subject: `DentalMall - Invoice ${order.order_number}`,
          html,
          text,
        });
      }

      await prisma.admin_action_logs.create({
        data: {
          admin_id: adminUser.id,
          target_user_id: order.user_id,
          action: 'INVOICE_GENERATED',
          details: `Generated invoice for order ${order.order_number}${emailSent ? ' and emailed it to the customer' : ''}`,
        },
      });

      return NextResponse.json({ invoice_url: invoiceUrl, email_sent: emailSent });
    } catch (error) {
      console.error('Error generating invoice:', error);
      return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
    }
  });
}

// GET - Download the stored invoice PDF as an attachment. Served through the
// API so the browser saves it with a proper filename (the `download` attribute
// is ignored for cross-origin storage URLs).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const adminUser = await requireAdmin(authUser.uid);
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { id } = await params;
      const order = await prisma.orders.findUnique({
        where: { id },
        select: { order_number: true, invoice_url: true },
      });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const { app } = getFirebaseAdmin();
      const file = getStorage(app).bucket().file(invoiceStoragePath(order.order_number));
      const [exists] = await file.exists();
      if (!order.invoice_url || !exists) {
        return NextResponse.json({ error: 'Invoice has not been generated' }, { status: 404 });
      }

      const [buffer] = await file.download();
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${order.order_number}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      return NextResponse.json({ error: 'Failed to download invoice' }, { status: 500 });
    }
  });
}
