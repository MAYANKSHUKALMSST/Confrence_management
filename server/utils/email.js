import nodemailer from 'nodemailer';
import db from '../db.js';

/**
 * Get email settings from the database.
 */
const getEmailSettings = () => {
  return db.get('SELECT * FROM email_settings ORDER BY updated_at DESC LIMIT 1');
};

/**
 * Creates a transporter using the settings from the database.
 */
const createTransporter = (settings) => {
  if (!settings) return null;

  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port),
    secure: parseInt(settings.smtp_port) === 465, // true for 465, false for others
    auth: {
      user: settings.email,
      pass: settings.app_password,
    },
  });
};

/**
 * Send an email using the configured SMTP settings.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const settings = getEmailSettings();
    if (!settings) {
      console.log('📧 Email not sent: No email settings configured.');
      return { success: false, error: 'Email settings not configured' };
    }

    const transporter = createTransporter(settings);
    if (!transporter) {
      return { success: false, error: 'Failed to create transporter' };
    }

    const info = await transporter.sendMail({
      from: `"Room Booking System" <${settings.email}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test the SMTP connection and send a test email.
 */
export const testConnection = async (settings) => {
  try {
    const transporter = createTransporter(settings);
    if (!transporter) {
      return { success: false, error: 'Invalid settings' };
    }

    // Verify connection configuration
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: `"Room Booking System Test" <${settings.email}>`,
      to: settings.email,
      subject: 'SMTP Connection Test',
      text: 'This is a test email to verify your SMTP settings. If you received this, your configuration is correct!',
      html: '<p>This is a test email to verify your SMTP settings. If you received this, your configuration is correct!</p>',
    });

    return { success: true };
  } catch (error) {
    console.error('❌ SMTP Test failed:', error);
    return { success: false, error: error.message };
  }
};
