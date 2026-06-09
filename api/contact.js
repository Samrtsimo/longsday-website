/**
 * Vercel Serverless Function — Contact Form Handler
 *
 * Receives form submissions from contact.html and forwards
 * them to the company email via NetEase Enterprise SMTP.
 *
 * Zero third-party cost. Unlimited submissions.
 */

const nodemailer = require('nodemailer');

// SMTP config from environment variables (set in Vercel Dashboard)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtphz.qiye.163.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER || 'lily-qian@longsday.com',
    pass: process.env.SMTP_PASS, // 授权码，不是登录密码
  },
};

const TO_EMAIL = process.env.TO_EMAIL || 'lily-qian@longsday.com';

/**
 * Validate form data
 */
function validate(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 1) {
    errors.push('Name is required');
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('Valid email is required');
  }
  if (!body.message || body.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  return errors;
}

/**
 * Build email content
 */
function buildEmail(body) {
  const fields = [];

  if (body.name) fields.push(`<tr><td><strong>Name:</strong></td><td>${escapeHtml(body.name)}</td></tr>`);
  if (body.company) fields.push(`<tr><td><strong>Company:</strong></td><td>${escapeHtml(body.company)}</td></tr>`);
  if (body.email) fields.push(`<tr><td><strong>Email:</strong></td><td><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></td></tr>`);
  if (body.phone) fields.push(`<tr><td><strong>Phone:</strong></td><td>${escapeHtml(body.phone)}</td></tr>`);
  if (body.mode) fields.push(`<tr><td><strong>Shipping Mode:</strong></td><td>${escapeHtml(body.mode)}</td></tr>`);
  if (body.message) fields.push(`<tr><td colspan="2" style="padding-top:16px"><strong>Message:</strong><br><br>${escapeHtml(body.message).replace(/\n/g, '<br>')}</td></tr>`);

  const subject = body.company
    ? `[Longsday] 询价来自 ${body.name} (${body.company})`
    : `[Longsday] 询价来自 ${body.name}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
      <div style="background:#162d59;color:#fff;padding:20px 24px">
        <h2 style="margin:0;font-size:18px">📦 Longsday 网站询价</h2>
      </div>
      <div style="padding:24px">
        <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse">
          ${fields.join('\n')}
        </table>
      </div>
      <div style="background:#f9f7e8;padding:12px 24px;font-size:12px;color:#888">
        Sent from longsday.com contact form · ${new Date().toISOString().split('T')[0]}
      </div>
    </div>
  `;

  return { subject, html };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Main handler
 */
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate
  const errors = validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // Check SMTP config
  if (!SMTP_CONFIG.auth.pass) {
    console.error('SMTP_PASS environment variable not set');
    return res.status(500).json({ error: 'Server email configuration missing. Please contact admin.' });
  }

  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    const { subject, html } = buildEmail(req.body);

    await transporter.sendMail({
      from: `"Longsday Website" <${SMTP_CONFIG.auth.user}>`,
      to: TO_EMAIL,
      subject,
      html,
      // Also send a plain-text version
      text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nCompany: ${req.body.company || '-'}\nPhone: ${req.body.phone || '-'}\nMode: ${req.body.mode || '-'}\n\nMessage:\n${req.body.message}\n\n---\nSent from longsday.com contact form`,
    });

    console.log(`✅ Contact form email sent: ${req.body.name} <${req.body.email}>`);
    return res.status(200).json({ success: true, message: 'Thank you! We will reply within 24 hours.' });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again or contact us directly by phone.' });
  }
};
