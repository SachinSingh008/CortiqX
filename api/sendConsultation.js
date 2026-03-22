import nodemailer from 'nodemailer'

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  if (!host || !user) return null
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass: process.env.SMTP_PASS || '',
    },
  })
}

/**
 * Vercel serverless: sends team notification + client confirmation.
 * Env: CONSULTATION_NOTIFY_EMAIL, MAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' })
    }
  }

  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().slice(0, 254)
  const phone = String(body.phone || '').trim().slice(0, 40)
  const company = String(body.company || '').trim().slice(0, 120)
  const topic = String(body.topic || '').trim().slice(0, 80)
  const message = String(body.message || '').trim().slice(0, 8000)
  const inquiryId = String(body.inquiryId || '').trim().slice(0, 128)
  const website = String(body.website || '').trim()

  if (website) {
    return res.status(200).json({ ok: true, emailsSent: false, ignored: true })
  }

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' })
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' })
  }

  const teamTo = (process.env.CONSULTATION_NOTIFY_EMAIL || '').trim()
  const from = (process.env.MAIL_FROM || process.env.SMTP_USER || '').trim()
  if (!teamTo || !from) {
    return res.status(200).json({
      ok: true,
      emailsSent: false,
      reason: 'CONSULTATION_NOTIFY_EMAIL or MAIL_FROM not set',
    })
  }

  const transporter = buildTransporter()
  if (!transporter) {
    return res.status(200).json({
      ok: true,
      emailsSent: false,
      reason: 'SMTP not configured',
    })
  }

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    company: escapeHtml(company),
    topic: escapeHtml(topic),
    message: escapeHtml(message),
    inquiryId: escapeHtml(inquiryId),
  }

  const textTeam = [
    'New consultation request',
    inquiryId ? `Reference: ${inquiryId}` : '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : '',
    company ? `Company: ${company}` : '',
    topic ? `Topic: ${topic}` : '',
    '',
    message,
  ]
    .filter(Boolean)
    .join('\n')

  const htmlTeam = `
    <h2>New consultation request</h2>
    ${inquiryId ? `<p><strong>Reference:</strong> ${safe.inquiryId}</p>` : ''}
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Name</td><td>${safe.name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Email</td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
      ${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Phone</td><td>${safe.phone}</td></tr>` : ''}
      ${company ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Company</td><td>${safe.company}</td></tr>` : ''}
      ${topic ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Topic</td><td>${safe.topic}</td></tr>` : ''}
    </table>
    <p style="margin-top:16px;font-family:system-ui,sans-serif;font-size:14px"><strong>Message</strong></p>
    <p style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px;border-left:3px solid #0891b2;padding-left:12px">${safe.message}</p>
  `

  const textClient = `Hi ${name},

Thanks for booking a consultation with us. We've received your request and will get back to you shortly.

Summary:
${topic ? `Topic: ${topic}\n` : ''}${message}

If you didn't submit this form, you can ignore this email.

— Team`

  const htmlClient = `
    <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#0f172a">Hi ${safe.name},</p>
    <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#334155">Thanks for booking a consultation. We've received your request and will get back to you shortly.</p>
    ${topic ? `<p style="font-family:system-ui,sans-serif;font-size:14px"><strong>Topic:</strong> ${safe.topic}</p>` : ''}
    <p style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px;color:#334155;border-left:3px solid #0891b2;padding-left:12px">${safe.message}</p>
    <p style="font-family:system-ui,sans-serif;font-size:13px;color:#64748b;margin-top:24px">If you didn't submit this form, you can ignore this email.</p>
  `

  try {
    await transporter.sendMail({
      from,
      to: teamTo,
      replyTo: email,
      subject: `New consultation: ${name}`,
      text: textTeam,
      html: htmlTeam,
    })

    await transporter.sendMail({
      from,
      to: email,
      subject: 'We received your consultation request',
      text: textClient,
      html: htmlClient,
    })

    return res.status(200).json({ ok: true, emailsSent: true })
  } catch (err) {
    console.error('[sendConsultation]', err)
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Failed to send email',
    })
  }
}
