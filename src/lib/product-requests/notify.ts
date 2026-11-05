import { prisma } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import {
  generateProductRequestAdminEmail,
  generateProductRequestCustomerEmail,
  ProductRequestEmailData,
} from '@/lib/email/templates/product-request';

/** Emails the customer and every active admin. Never throws: the request is already saved. */
export async function notifyProductRequest(data: ProductRequestEmailData): Promise<void> {
  try {
    const admins = await prisma.users.findMany({
      where: { role: 'ADMIN', is_active: true },
      select: { email: true },
    });

    const customerEmail = generateProductRequestCustomerEmail(data);
    const adminEmail = generateProductRequestAdminEmail(data);

    await Promise.allSettled([
      sendEmail({ to: data.customer.email, ...customerEmail }),
      ...admins.map((admin) => sendEmail({ to: admin.email, ...adminEmail })),
    ]);
  } catch (error) {
    console.error('Failed to send product request emails:', error);
  }
}
