import { OrderStatusEmailData } from '@/types/models';

const statusLabels: Record<string, { en: string; ka: string }> = {
  PENDING: { en: 'Pending', ka: 'მოლოდინში' },
  CONFIRMED: { en: 'Confirmed', ka: 'დადასტურებული' },
  PROCESSING: { en: 'Processing', ka: 'მუშავდება' },
  SHIPPED: { en: 'Shipped', ka: 'გაგზავნილი' },
  DELIVERED: { en: 'Delivered', ka: 'მიწოდებული' },
  CANCELLED: { en: 'Cancelled', ka: 'გაუქმებული' },
  INVOICE_SENT: { en: 'Invoice Sent', ka: 'ინვოისი გაგზავნილია' },
  PAID: { en: 'Paid', ka: 'გადახდილი' },
  FAILED: { en: 'Failed', ka: 'წარუმატებელი' },
  REFUNDED: { en: 'Refunded', ka: 'დაბრუნებული' },
};

const statusColors: Record<string, string> = {
  PENDING: '#ff9800',
  CONFIRMED: '#2196f3',
  PROCESSING: '#5B6ECD',
  SHIPPED: '#9c27b0',
  DELIVERED: '#4caf50',
  CANCELLED: '#f44336',
  INVOICE_SENT: '#2196f3',
  PAID: '#4caf50',
  FAILED: '#f44336',
  REFUNDED: '#9c27b0',
};

function getStatusMessage(data: OrderStatusEmailData): { en: string; ka: string } {
  if (data.changedField === 'payment_status') {
    switch (data.newStatus) {
      case 'PAID':
        return {
          en: 'Your payment has been confirmed. Your order is now being processed.',
          ka: 'თქვენი გადახდა დადასტურებულია. თქვენი შეკვეთა მუშავდება.',
        };
      case 'INVOICE_SENT':
        return {
          en: 'An invoice has been sent to your email. Please complete the payment within 7 days.',
          ka: 'ინვოისი გამოგზავნილია თქვენს ელ-ფოსტაზე. გთხოვთ გადაიხადოთ 7 დღის განმავლობაში.',
        };
      case 'REFUNDED':
        return {
          en: 'Your payment has been refunded.',
          ka: 'თქვენი გადახდა დაბრუნებულია.',
        };
      default:
        return {
          en: `Your payment status has been updated to ${statusLabels[data.newStatus]?.en || data.newStatus}.`,
          ka: `თქვენი გადახდის სტატუსი განახლდა: ${statusLabels[data.newStatus]?.ka || data.newStatus}.`,
        };
    }
  }

  switch (data.newStatus) {
    case 'CONFIRMED':
      return {
        en: 'Your order has been confirmed and is being prepared.',
        ka: 'თქვენი შეკვეთა დადასტურებულია და მზადდება.',
      };
    case 'PROCESSING':
      return {
        en: 'Your order is currently being processed.',
        ka: 'თქვენი შეკვეთა მუშავდება.',
      };
    case 'SHIPPED':
      return {
        en: 'Your order has been shipped and is on its way!',
        ka: 'თქვენი შეკვეთა გაგზავნილია!',
      };
    case 'DELIVERED':
      return {
        en: 'Your order has been delivered. Thank you for your purchase!',
        ka: 'თქვენი შეკვეთა მიწოდებულია. მადლობა შეკვეთისთვის!',
      };
    case 'CANCELLED':
      return {
        en: 'Your order has been cancelled. If you have questions, please contact us.',
        ka: 'თქვენი შეკვეთა გაუქმებულია. თუ გაქვთ კითხვები, გთხოვთ დაგვიკავშირდეთ.',
      };
    default:
      return {
        en: `Your order status has been updated to ${statusLabels[data.newStatus]?.en || data.newStatus}.`,
        ka: `თქვენი შეკვეთის სტატუსი განახლდა: ${statusLabels[data.newStatus]?.ka || data.newStatus}.`,
      };
  }
}

export function generateOrderStatusEmail(data: OrderStatusEmailData): { html: string; text: string } {
  const label = statusLabels[data.newStatus] || { en: data.newStatus, ka: data.newStatus };
  const color = statusColors[data.newStatus] || '#5B6ECD';
  const message = getStatusMessage(data);
  const fieldLabel = data.changedField === 'payment_status'
    ? { en: 'Payment Status', ka: 'გადახდის სტატუსი' }
    : { en: 'Order Status', ka: 'შეკვეთის სტატუსი' };

  const html = `
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #01DBE6 0%, #5B6ECD 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">DentalMall</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order Update / შეკვეთის განახლება</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <!-- Greeting -->
      <p style="font-size: 16px; color: #2C2957; margin: 0 0 20px 0;">
        Hello, ${data.customerName}!<br/>
        გამარჯობა, ${data.customerName}!
      </p>

      <!-- Order Number -->
      <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0; color: #666;">Order Number / შეკვეთის ნომერი:</p>
        <p style="margin: 5px 0 0 0; color: #5B6ECD; font-size: 20px; font-weight: bold;">${data.orderNumber}</p>
      </div>

      <!-- Status Update -->
      <div style="margin-bottom: 25px; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
          ${fieldLabel.en} / ${fieldLabel.ka}
        </p>
        <div style="display: inline-block; padding: 10px 30px; background-color: ${color}; color: white; border-radius: 30px; font-size: 16px; font-weight: bold;">
          ${label.en} / ${label.ka}
        </div>
      </div>

      <!-- Message -->
      <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f5f5ff 0%, #fff5f5 100%); border-radius: 8px; border-left: 4px solid ${color};">
        <p style="margin: 0 0 10px 0; color: #2C2957; line-height: 1.6;">${message.en}</p>
        <p style="margin: 0; color: #666; line-height: 1.6;">${message.ka}</p>
      </div>

      ${data.invoiceUrl ? `
      <!-- Invoice Link -->
      <div style="margin-bottom: 25px; text-align: center;">
        <a href="${data.invoiceUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #5B6ECD 0%, #01DBE6 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Invoice / ინვოისის ნახვა
        </a>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">Thank you for shopping with DentalMall!</p>
        <p style="margin: 5px 0;">მადლობა რომ ირჩევთ DentalMall-ს!</p>
        <p style="margin: 15px 0 0 0;">
          <a href="mailto:support@dentalmall.ge" style="color: #5B6ECD;">support@dentalmall.ge</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const text = `
DENTALMALL - ORDER UPDATE
================================

Hello, ${data.customerName}!

Order Number: ${data.orderNumber}

${fieldLabel.en}: ${label.en}
${fieldLabel.ka}: ${label.ka}

${message.en}
${message.ka}
${data.invoiceUrl ? `\nView Invoice: ${data.invoiceUrl}\n` : ''}
------------------------------------------
Thank you for shopping with DentalMall!
support@dentalmall.ge
`;

  return { html, text };
}
