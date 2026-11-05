import type { ProductRequestItemInput } from '@/lib/validations/product-request';

export interface ProductRequestEmailData {
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  items: ProductRequestItemInput[];
}

/** Everything here is typed by the customer, and the HTML goes to admins' inboxes. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapHtml(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #01DBE6 0%, #5B6ECD 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">DentalMall</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${title}</p>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      ${content}
    </div>
  </div>
</body>
</html>
`;
}

export function generateProductRequestCustomerEmail(data: ProductRequestEmailData) {
  const subject = 'გმადლობთ პროდუქტის მოთხოვნისთვის!';
  const message =
    'გმადლობთ პროდუქტის მოთხოვნისთვის! დენტალმოლის გუნდი მალე დაგიკავშირდებათ. თქვენი მოთხოვნილი პროდუქტები:';

  const html = wrapHtml(
    subject,
    `
      <p style="font-size: 16px; color: #2C2957; line-height: 1.6; margin: 0 0 15px 0;">${message}</p>
      <ul style="color: #2C2957; line-height: 1.8; margin: 0; padding-left: 20px;">
        ${data.items.map((item) => `<li>${escapeHtml(item.name)}</li>`).join('')}
      </ul>
    `
  );

  const text = `${message}\n\n${data.items.map((item) => `- ${item.name}`).join('\n')}\n`;

  return { subject, html, text };
}

export function generateProductRequestAdminEmail(data: ProductRequestEmailData) {
  const { customer, items } = data;
  const customerName = `${customer.first_name} ${customer.last_name}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';
  const adminUrl = `${siteUrl}/ka/admin/product-requests`;
  const subject = `პროდუქტის ახალი მოთხოვნა (${items.length})`;

  const details = (item: ProductRequestItemInput): [string, string][] => [
    ['დასახელება (რასაც ეძახით)', item.name],
    ['დასახელება (ინვოისის მიხედვით)', item.invoice_name || '—'],
    ['მოკლე აღწერა', item.description],
    ['საორიენტაციო ფასი', item.estimated_price],
    ['მაღაზია (ვისგანაც იყიდეთ)', item.store],
    ['რაოდენობა', item.quantity],
  ];

  const html = wrapHtml(
    subject,
    `
      <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; color: #2C2957; line-height: 1.8;">
        <strong>${escapeHtml(customerName)}</strong><br/>
        ${escapeHtml(customer.email)}<br/>
        ${escapeHtml(customer.phone_number)}
      </div>
      ${items
        .map(
          (item, index) => `
      <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; color: #2C2957; line-height: 1.6;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #5B6ECD;">#${index + 1}</p>
        ${details(item)
          .map(([label, value]) => `<div><span style="color: #666;">${label}:</span> ${escapeHtml(value)}</div>`)
          .join('')}
        ${item.photo_url ? `<div><a href="${escapeHtml(item.photo_url)}" style="color: #5B6ECD;">ფოტო</a></div>` : ''}
      </div>`
        )
        .join('')}
      <div style="text-align: center;">
        <a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #5B6ECD 0%, #01DBE6 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          მოთხოვნილი პროდუქტი
        </a>
      </div>
    `
  );

  const text = [
    subject,
    '',
    customerName,
    customer.email,
    customer.phone_number,
    '',
    ...items.flatMap((item, index) => [
      `#${index + 1}`,
      ...details(item).map(([label, value]) => `${label}: ${value}`),
      ...(item.photo_url ? [`ფოტო: ${item.photo_url}`] : []),
      '',
    ]),
    adminUrl,
  ].join('\n');

  return { subject, html, text };
}
