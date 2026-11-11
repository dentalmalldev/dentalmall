import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { InvoiceData } from '@/types/models';
import fs from 'fs';
import path from 'path';

// The standard Helvetica fallback only encodes WinAnsi (Latin-1), and pdf-lib
// throws on anything else. Replace those characters so a missing font file
// degrades the PDF instead of failing it.
function toWinAnsi(text: string): string {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Set when the Georgian font can't be loaded.
  let usingFallbackFont = false;
  const sanitizeText = (text: string | undefined | null): string => {
    if (!text) return '-';
    return usingFallbackFont ? toWinAnsi(text) : text;
  };

  // Try to load Noto Sans Georgian for Georgian character support
  let helvetica: PDFFont;
  let helveticaBold: PDFFont;
  try {
    pdfDoc.registerFontkit(fontkit);
    const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansGeorgian-Regular.ttf');
    const boldFontPath = path.join(process.cwd(), 'public/fonts/NotoSansGeorgian-Bold.ttf');
    if (fs.existsSync(fontPath) && fs.existsSync(boldFontPath)) {
      const fontBytes = fs.readFileSync(fontPath);
      const boldFontBytes = fs.readFileSync(boldFontPath);
      helvetica = await pdfDoc.embedFont(fontBytes);
      helveticaBold = await pdfDoc.embedFont(boldFontBytes);
      usingFallbackFont = false;
    } else {
      console.error(`Invoice font not found at ${fontPath}; falling back to Helvetica (no Georgian support)`);
      helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      usingFallbackFont = true;
    }
  } catch (fontError) {
    console.error('Failed to embed invoice font; falling back to Helvetica:', fontError);
    helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    usingFallbackFont = true;
  }

  // Bilingual label in the form "ქართული/English". The fallback font can't
  // draw Georgian, so it gets the English half only.
  const bi = (ka: string, en: string): string => (usingFallbackFont ? en : `${ka}/${en}`);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width: pageWidth, height } = page.getSize();

  const primaryColor = rgb(0.357, 0.431, 0.804); // #5B6ECD
  const textColor = rgb(0.173, 0.161, 0.341); // #2C2957
  const grayColor = rgb(0.4, 0.4, 0.4);
  const accentColor = rgb(0.004, 0.859, 0.902); // #01DBE6
  const discountColor = rgb(0.86, 0.21, 0.27);

  type Color = ReturnType<typeof rgb>;

  const marginLeft = 50;
  const marginRight = 545;

  // Georgian glyphs are wider than Latin ones, so position by measured width
  // rather than fixed offsets.
  const drawRight = (text: string, right: number, y: number, size: number, font: PDFFont, color: Color) => {
    page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, size, font, color });
  };
  const drawCentered = (text: string, y: number, size: number, font: PDFFont, color: Color) => {
    page.drawText(text, { x: (pageWidth - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });
  };
  const fitText = (text: string, maxWidth: number, size: number, font: PDFFont): string => {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
    let cut = text;
    while (cut.length > 0 && font.widthOfTextAtSize(`${cut}...`, size) > maxWidth) {
      cut = cut.slice(0, -1);
    }
    return `${cut}...`;
  };
  const drawSectionTitle = (title: string, y: number) => {
    page.drawText(title, { x: marginLeft, y, size: 14, font: helveticaBold, color: primaryColor });
    page.drawLine({
      start: { x: marginLeft, y: y - 5 },
      end: { x: marginLeft + helveticaBold.widthOfTextAtSize(title, 14), y: y - 5 },
      thickness: 2,
      color: accentColor,
    });
  };

  let y = height - 50;

  // Header
  page.drawText('DentalMall', {
    x: marginLeft,
    y,
    size: 28,
    font: helveticaBold,
    color: primaryColor,
  });

  y -= 20;
  page.drawText(bi('ინვოისი', 'Invoice'), {
    x: marginLeft,
    y,
    size: 12,
    font: helvetica,
    color: grayColor,
  });

  // Order info - right aligned
  drawRight(`${bi('შეკვეთა', 'Order')}: ${sanitizeText(data.orderNumber)}`, marginRight, height - 50, 10, helveticaBold, textColor);
  drawRight(`${bi('თარიღი', 'Date')}: ${sanitizeText(data.orderDate)}`, marginRight, height - 65, 10, helvetica, grayColor);

  y -= 50;

  // Customer Details Section
  drawSectionTitle(bi('მომხმარებლის მონაცემები', 'Customer Details'), y);

  y -= 25;
  const customerDetails = [
    `${bi('სახელი', 'Name')}: ${sanitizeText(data.customerName)}`,
    `${bi('ელფოსტა', 'Email')}: ${sanitizeText(data.customerEmail)}`,
    `${bi('მიმღები', 'Recipient')}: ${sanitizeText(data.address?.recipient_name)}`,
    `${bi('ტელეფონი', 'Mobile')}: ${sanitizeText(data.address?.mobile_number)}`,
    `${bi('მისამართი', 'Address')}: ${sanitizeText(data.address?.city)}, ${sanitizeText(data.address?.address)}${data.address?.postal_code ? `, ${data.address.postal_code}` : ''}`,
    `${bi('გადახდა', 'Payment')}: ${data.paymentMethod === 'INVOICE' ? bi('ინვოისი', 'Invoice') : sanitizeText(data.paymentMethod)}`,
  ];

  for (const line of customerDetails) {
    page.drawText(fitText(line, marginRight - marginLeft, 10, helvetica), {
      x: marginLeft,
      y,
      size: 10,
      font: helvetica,
      color: textColor,
    });
    y -= 15;
  }

  y -= 20;

  // Order Items Section
  drawSectionTitle(bi('შეკვეთის პროდუქტები', 'Order Items'), y);

  y -= 25;

  // Table columns: product name on the left, numbers right-aligned.
  const colQtyRight = 350;
  const colPriceRight = 445;
  const colTotalRight = 540;
  const productMaxWidth = 245;

  // Table Header
  page.drawRectangle({
    x: marginLeft,
    y: y - 5,
    width: marginRight - marginLeft,
    height: 20,
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawText(bi('პროდუქტი', 'Product'), { x: 55, y, size: 9, font: helveticaBold, color: textColor });
  drawRight(bi('რაოდ.', 'Qty'), colQtyRight, y, 9, helveticaBold, textColor);
  drawRight(bi('ფასი', 'Price'), colPriceRight, y, 9, helveticaBold, textColor);
  drawRight(bi('ჯამი', 'Total'), colTotalRight, y, 9, helveticaBold, textColor);

  y -= 25;

  // Table Rows
  for (const item of data.items) {
    const itemName = sanitizeText(item.name);
    const fullName = item.variantName ? `${itemName} (${sanitizeText(item.variantName)})` : itemName;
    const productName = fitText(fullName, productMaxWidth, 9, helvetica);
    const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
    const itemTotal = typeof item.total === 'number' ? item.total : parseFloat(String(item.total)) || 0;

    page.drawText(productName, { x: 55, y, size: 9, font: helvetica, color: textColor });
    drawRight((item.quantity || 0).toString(), colQtyRight, y, 9, helvetica, textColor);
    drawRight(price.toFixed(2), colPriceRight, y, 9, helvetica, textColor);
    drawRight(itemTotal.toFixed(2), colTotalRight, y, 9, helvetica, textColor);

    y -= 20;

    page.drawLine({
      start: { x: marginLeft, y: y + 15 },
      end: { x: marginRight, y: y + 15 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
  }

  y -= 20;

  // Safe number parsing
  const subtotal = typeof data.subtotal === 'number' ? data.subtotal : parseFloat(String(data.subtotal)) || 0;
  const discountVal = typeof data.discount === 'number' ? data.discount : parseFloat(String(data.discount)) || 0;
  const deliveryFee = typeof data.deliveryFee === 'number' ? data.deliveryFee : parseFloat(String(data.deliveryFee)) || 0;
  const total = typeof data.total === 'number' ? data.total : parseFloat(String(data.total)) || 0;
  const credit = typeof data.credit === 'number' ? data.credit : parseFloat(String(data.credit)) || 0;
  const amountToPay = typeof data.amountToPay === 'number' ? data.amountToPay : parseFloat(String(data.amountToPay)) || 0;

  // Totals Section
  const totalsLeft = 300;
  const totalsLabelX = totalsLeft + 10;
  const totalsValueRight = marginRight - 5;
  // The box grows for a discount row and for the credit + amount-to-pay rows.
  const extraRows = (discountVal > 0 ? 20 : 0) + (credit > 0 ? 40 : 0);

  page.drawRectangle({
    x: totalsLeft,
    y: y - 50 - extraRows,
    width: marginRight - totalsLeft,
    height: 65 + extraRows,
    color: rgb(0.97, 0.97, 0.97),
  });

  page.drawText(`${bi('ქვეჯამი', 'Subtotal')}:`, { x: totalsLabelX, y, size: 10, font: helvetica, color: textColor });
  drawRight(`${subtotal.toFixed(2)} GEL`, totalsValueRight, y, 10, helvetica, textColor);
  y -= 18;

  if (discountVal > 0) {
    page.drawText(`${bi('ფასდაკლება', 'Discount')}:`, { x: totalsLabelX, y, size: 10, font: helvetica, color: discountColor });
    drawRight(`-${discountVal.toFixed(2)} GEL`, totalsValueRight, y, 10, helvetica, discountColor);
    y -= 18;
  }

  page.drawText(`${bi('მიწოდება', 'Delivery')}:`, { x: totalsLabelX, y, size: 10, font: helvetica, color: textColor });
  drawRight(`${deliveryFee.toFixed(2)} GEL`, totalsValueRight, y, 10, helvetica, textColor);
  y -= 18;

  page.drawLine({
    start: { x: totalsLabelX, y: y + 12 },
    end: { x: totalsValueRight, y: y + 12 },
    thickness: 1,
    color: textColor,
  });

  y -= 5;
  page.drawText(`${bi('სულ', 'Total')}:`, { x: totalsLabelX, y, size: 14, font: helveticaBold, color: textColor });
  drawRight(`${total.toFixed(2)} GEL`, totalsValueRight, y, 14, helveticaBold, primaryColor);

  if (credit > 0) {
    const creditColor = rgb(0.086, 0.639, 0.29); // #16A34A
    y -= 20;
    page.drawText(`${bi('კრედიტი', 'Credit')}:`, { x: totalsLabelX, y, size: 10, font: helvetica, color: creditColor });
    drawRight(`-${credit.toFixed(2)} GEL`, totalsValueRight, y, 10, helvetica, creditColor);
    y -= 18;
    page.drawText(`${bi('გადასახდელი', 'To pay')}:`, { x: totalsLabelX, y, size: 11, font: helveticaBold, color: textColor });
    drawRight(`${amountToPay.toFixed(2)} GEL`, totalsValueRight, y, 11, helveticaBold, primaryColor);
  }

  y -= 50;

  // Payment Instructions
  drawSectionTitle(bi('გადახდის ინსტრუქცია', 'Payment Instructions'), y);

  y -= 25;
  const paymentInstructions = [
    ...(usingFallbackFont ? [] : ['გთხოვთ, ინვოისის თანხა გადაიხადოთ 7 დღის განმავლობაში.']),
    'Please pay the invoice amount within 7 days.',
    '',
    `${bi('ბანკი', 'Bank')}: ${bi('საქართველოს ბანკი', 'Bank of Georgia')}`,
    `${bi('ანგარიში', 'Account')}: GE12BG0000000607284129`,
    `${bi('დანიშნულება', 'Purpose')}: ${bi('შეკვეთა', 'Order')} ${sanitizeText(data.orderNumber)}`,
  ];

  for (const line of paymentInstructions) {
    page.drawText(line, {
      x: marginLeft,
      y,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    y -= 15;
  }

  // Footer
  y = 65;
  if (!usingFallbackFont) {
    drawCentered('გმადლობთ, რომ სარგებლობთ DentalMall-ით!', y, 10, helvetica, grayColor);
  }
  drawCentered('Thank you for shopping with DentalMall!', y - 15, 10, helvetica, grayColor);
  drawCentered('support@dentalmall.ge', y - 30, 10, helvetica, primaryColor);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
