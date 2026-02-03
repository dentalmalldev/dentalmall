import nodemailer from 'nodemailer';

// Create transporter based on environment
const createTransporter = () => {
  // For production, use SMTP settings
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development, use ethereal email (fake SMTP)
  // You can view sent emails at https://ethereal.email
  console.warn('No SMTP configuration found. Emails will not be sent in production.');
  return null;
};

const transporter = createTransporter();

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    console.log('Email would be sent to:', options.to);
    console.log('Subject:', options.subject);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"DentalMall" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf',
      })),
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export { transporter };
