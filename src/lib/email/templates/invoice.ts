import { InvoiceData } from '@/types/models';

export function generateInvoiceEmail(data: InvoiceData, invoiceUrl?: string): { html: string; text: string } {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} ₾</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.total.toFixed(2)} ₾</td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #01DBE6 0%, #5B6ECD 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">DentalMall</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Invoice / ინვოისი</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <!-- Order Info -->
      <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0;">
              <strong>Order Number / შეკვეთის ნომერი:</strong><br/>
              <span style="color: #5B6ECD; font-size: 18px; font-weight: bold;">${data.orderNumber}</span>
            </td>
            <td style="padding: 5px 0; text-align: right;">
              <strong>Date / თარიღი:</strong><br/>
              ${data.orderDate}
            </td>
          </tr>
        </table>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2C2957; margin: 0 0 15px 0; border-bottom: 2px solid #01DBE6; padding-bottom: 10px;">
          Customer Details / მომხმარებლის მონაცემები
        </h3>
        <p style="margin: 5px 0;"><strong>Name / სახელი:</strong> ${data.customerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
        <p style="margin: 5px 0;"><strong>Address / მისამართი:</strong> ${data.address.city}, ${data.address.address}</p>
        <p style="margin: 5px 0;"><strong>Payment Method / გადახდის მეთოდი:</strong> ${data.paymentMethod === 'INVOICE' ? 'Invoice / ინვოისი' : data.paymentMethod}</p>
      </div>

      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2C2957; margin: 0 0 15px 0; border-bottom: 2px solid #01DBE6; padding-bottom: 10px;">
          Order Items / შეკვეთილი პროდუქტები
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product / პროდუქტი</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty / რაოდენობა</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price / ფასი</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total / ჯამი</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;">Subtotal / ქვეჯამი:</td>
            <td style="padding: 8px 0; text-align: right;">${data.subtotal.toFixed(2)} ₾</td>
          </tr>
          ${data.discount > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #dc3545;">Discount / ფასდაკლება:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc3545;">-${data.discount.toFixed(2)} ₾</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0;">Delivery Fee / მიწოდება:</td>
            <td style="padding: 8px 0; text-align: right;">${data.deliveryFee.toFixed(2)} ₾</td>
          </tr>
          <tr style="font-size: 18px; font-weight: bold;">
            <td style="padding: 15px 0; border-top: 2px solid #ddd; color: #2C2957;">Total / ჯამი:</td>
            <td style="padding: 15px 0; border-top: 2px solid #ddd; text-align: right; color: #5B6ECD;">${data.total.toFixed(2)} ₾</td>
          </tr>
        </table>
      </div>

      <!-- Download Invoice Button -->
      ${invoiceUrl ? `
      <div style="margin-bottom: 30px; text-align: center;">
        <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #5B6ECD 0%, #01DBE6 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Download Invoice PDF / ინვოისის ჩამოტვირთვა
        </a>
      </div>
      ` : ''}

      <!-- Payment Instructions -->
      <div style="padding: 20px; background: linear-gradient(135deg, #fff5f5 0%, #f5f5ff 100%); border-radius: 8px; border-left: 4px solid #5B6ECD;">
        <h4 style="margin: 0 0 10px 0; color: #2C2957;">Payment Instructions / გადახდის ინსტრუქცია</h4>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          Please pay the invoice amount within 7 days.<br/>
          გთხოვთ გადაიხადოთ ინვოისის თანხა 7 დღის განმავლობაში.
        </p>
        <p style="margin: 15px 0 0 0; color: #666;">
          <strong>Bank / ბანკი:</strong> TBC Bank<br/>
          <strong>Account / ანგარიში:</strong> GE00TB0000000000000000<br/>
          <strong>Purpose / დანიშნულება:</strong> Order ${data.orderNumber}
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">Thank you for shopping with DentalMall!</p>
        <p style="margin: 5px 0;">მადლობა რომ ირჩევთ DentalMall-ს!</p>
        <p style="margin: 15px 0 0 0;">
          If you have any questions, please contact us at<br/>
          <a href="mailto:support@dentalmall.ge" style="color: #5B6ECD;">support@dentalmall.ge</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const itemsText = data.items
    .map(
      (item) =>
        `  - ${item.name} x${item.quantity} - ${item.price.toFixed(2)} ₾ = ${item.total.toFixed(2)} ₾`
    )
    .join('\n');

  const text = `
DENTALMALL - INVOICE / ინვოისი
================================

Order Number / შეკვეთის ნომერი: ${data.orderNumber}
Date / თარიღი: ${data.orderDate}
${invoiceUrl ? `\nDownload Invoice PDF / ინვოისის ჩამოტვირთვა: ${invoiceUrl}\n` : ''}
CUSTOMER DETAILS / მომხმარებლის მონაცემები
------------------------------------------
Name / სახელი: ${data.customerName}
Email: ${data.customerEmail}
Address / მისამართი: ${data.address.city}, ${data.address.address}
Payment Method / გადახდის მეთოდი: ${data.paymentMethod === 'INVOICE' ? 'Invoice / ინვოისი' : data.paymentMethod}

ORDER ITEMS / შეკვეთილი პროდუქტები
------------------------------------------
${itemsText}

TOTALS / ჯამები
------------------------------------------
Subtotal / ქვეჯამი: ${data.subtotal.toFixed(2)} ₾
${data.discount > 0 ? `Discount / ფასდაკლება: -${data.discount.toFixed(2)} ₾\n` : ''}Delivery Fee / მიწოდება: ${data.deliveryFee.toFixed(2)} ₾
TOTAL / ჯამი: ${data.total.toFixed(2)} ₾

PAYMENT INSTRUCTIONS / გადახდის ინსტრუქცია
------------------------------------------
Please pay the invoice amount within 7 days.
გთხოვთ გადაიხადოთ ინვოისის თანხა 7 დღის განმავლობაში.

Bank / ბანკი: TBC Bank
Account / ანგარიში: GE00TB0000000000000000
Purpose / დანიშნულება: Order ${data.orderNumber}

------------------------------------------
Thank you for shopping with DentalMall!
მადლობა რომ ირჩევთ DentalMall-ს!

For questions, contact: support@dentalmall.ge
`;

  return { html, text };
}
