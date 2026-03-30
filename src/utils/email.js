const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Simple inline templates ──────────────────────────────
const templates = {
  welcome: ({ firstName, verificationLink }) => ({
    subject: 'Welcome — Verify your account',
    html: `
      <h2>Welcome, ${firstName}!</h2>
      <p>Thank you for joining HealthcarePlatform.</p>
      <a href="${verificationLink}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Verify Account
      </a>
    `,
  }),
  resetPassword: ({ firstName, resetLink }) => ({
    subject: 'Password Reset Request',
    html: `
      <h2>Hi ${firstName},</h2>
      <p>You requested a password reset. This link expires in 10 minutes.</p>
      <a href="${resetLink}" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  }),
  appointmentConfirmation: ({ patientName, doctorName, date, time }) => ({
    subject: 'Appointment Confirmed',
    html: `
      <h2>Appointment Confirmed ✅</h2>
      <p>Hi ${patientName}, your appointment with <strong>Dr. ${doctorName}</strong> is confirmed.</p>
      <p><strong>Date:</strong> ${date} at ${time}</p>
    `,
  }),
  orderConfirmation: ({ patientName, orderNumber, items }) => ({
    subject: `Order #${orderNumber} Confirmed`,
    html: `
      <h2>Order Confirmed 🎉</h2>
      <p>Hi ${patientName}, your pharmacy order <strong>#${orderNumber}</strong> has been received.</p>
      <p>Items: ${items}</p>
      <p>You will receive delivery updates via the app.</p>
    `,
  }),
};

const sendEmail = async ({ to, template, data, subject, html }) => {
  try {
    let emailContent;

    if (template && templates[template]) {
      emailContent = templates[template](data);
    } else {
      emailContent = { subject, html };
    }

    await transporter.sendMail({
      from: `"HealthcarePlatform" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logger.info(`📧 Email sent to ${to}`);
  } catch (error) {
    logger.error(`❌ Email failed to ${to}:`, error.message);
    // Don't throw — email failure shouldn't crash the request
  }
};

module.exports = { sendEmail };