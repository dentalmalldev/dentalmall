import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { InvoiceData } from '@/types/models';

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.357, 0.431, 0.804); // #5B6ECD
  const textColor = rgb(0.173, 0.161, 0.341); // #2C2957
  const grayColor = rgb(0.4, 0.4, 0.4);

  let y = height - 50;

  // Header
  page.drawText('DentalMall', {
    x: 50,
    y,
    size: 28,
    font: helveticaBold,
    color: primaryColor,
  });

  y -= 20;
  page.drawText('Invoice', {
    x: 50,
    y,
    size: 12,
    font: helvetica,
    color: grayColor,
  });

  // Order info - right aligned
  page.drawText(`Order: ${data.orderNumber}`, {
    x: 400,
    y: height - 50,
    size: 10,
    font: helveticaBold,
    color: textColor,
  });

  page.drawText(`Date: ${data.orderDate}`, {
    x: 400,
    y: height - 65,
    size: 10,
    font: helvetica,
    color: grayColor,
  });

  y -= 50;

  // Customer Details Section
  page.drawText('Customer Details', {
    x: 50,
    y,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  });

  y -= 5;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 200, y },
    thickness: 2,
    color: rgb(0.004, 0.859, 0.902), // #01DBE6
  });

  y -= 20;
  const customerDetails = [
    `Name: ${data.customerName}`,
    `Email: ${data.customerEmail}`,
    `Address: ${data.address.city}, ${data.address.address}`,
    `Payment: ${data.paymentMethod === 'INVOICE' ? 'Invoice' : data.paymentMethod}`,
  ];

  for (const line of customerDetails) {
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: textColor,
    });
    y -= 15;
  }

  y -= 20;

  // Order Items Section
  page.drawText('Order Items', {
    x: 50,
    y,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  });

  y -= 5;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 200, y },
    thickness: 2,
    color: rgb(0.004, 0.859, 0.902),
  });

  y -= 20;

  // Table Header
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: 495,
    height: 20,
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawText('Product', { x: 55, y, size: 9, font: helveticaBold, color: textColor });
  page.drawText('Qty', { x: 320, y, size: 9, font: helveticaBold, color: textColor });
  page.drawText('Price', { x: 380, y, size: 9, font: helveticaBold, color: textColor });
  page.drawText('Total', { x: 470, y, size: 9, font: helveticaBold, color: textColor });

  y -= 25;

  // Table Rows
  for (const item of data.items) {
    // Truncate long product names
    const fullName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    const productName = fullName.length > 40 ? fullName.substring(0, 37) + '...' : fullName;

    page.drawText(productName, { x: 55, y, size: 9, font: helvetica, color: textColor });
    page.drawText(item.quantity.toString(), { x: 325, y, size: 9, font: helvetica, color: textColor });
    page.drawText(`${item.price.toFixed(2)}`, { x: 380, y, size: 9, font: helvetica, color: textColor });
    page.drawText(`${item.total.toFixed(2)}`, { x: 470, y, size: 9, font: helvetica, color: textColor });

    y -= 20;

    page.drawLine({
      start: { x: 50, y: y + 15 },
      end: { x: 545, y: y + 15 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
  }

  y -= 20;

  // Totals Section
  page.drawRectangle({
    x: 350,
    y: y - (data.discount > 0 ? 70 : 50),
    width: 195,
    height: data.discount > 0 ? 85 : 65,
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawText('Subtotal:', { x: 360, y, size: 10, font: helvetica, color: textColor });
  page.drawText(`${data.subtotal.toFixed(2)} GEL`, { x: 470, y, size: 10, font: helvetica, color: textColor });
  y -= 18;

  if (data.discount > 0) {
    page.drawText('Discount:', { x: 360, y, size: 10, font: helvetica, color: rgb(0.86, 0.21, 0.27) });
    page.drawText(`-${data.discount.toFixed(2)} GEL`, { x: 470, y, size: 10, font: helvetica, color: rgb(0.86, 0.21, 0.27) });
    y -= 18;
  }

  page.drawText('Delivery:', { x: 360, y, size: 10, font: helvetica, color: textColor });
  page.drawText(`${data.deliveryFee.toFixed(2)} GEL`, { x: 470, y, size: 10, font: helvetica, color: textColor });
  y -= 18;

  page.drawLine({
    start: { x: 360, y: y + 12 },
    end: { x: 540, y: y + 12 },
    thickness: 1,
    color: textColor,
  });

  y -= 5;
  page.drawText('Total:', { x: 360, y, size: 14, font: helveticaBold, color: textColor });
  page.drawText(`${data.total.toFixed(2)} GEL`, { x: 460, y, size: 14, font: helveticaBold, color: primaryColor });

  y -= 50;

  // Payment Instructions
  page.drawText('Payment Instructions', {
    x: 50,
    y,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  });

  y -= 5;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 250, y },
    thickness: 2,
    color: rgb(0.004, 0.859, 0.902),
  });

  y -= 20;
  const paymentInstructions = [
    'Please pay the invoice amount within 7 days.',
    '',
    'Bank: TBC Bank',
    'Account: GE00TB0000000000000000',
    `Purpose: Order ${data.orderNumber}`,
  ];

  for (const line of paymentInstructions) {
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    y -= 15;
  }

  // Footer
  y = 50;
  page.drawText('Thank you for shopping with DentalMall!', {
    x: 180,
    y,
    size: 10,
    font: helvetica,
    color: grayColor,
  });

  page.drawText('support@dentalmall.ge', {
    x: 230,
    y: y - 15,
    size: 10,
    font: helvetica,
    color: primaryColor,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
