/**
 * Transactional email over SMTP.
 *
 * Same approach as maleq-headless (`lib/email/alert.ts`): plain nodemailer
 * against an existing mailbox, so there is no third-party email service to pay
 * for. Host/port default to iCloud's SMTP endpoint, matching maleq.
 *
 * When SMTP credentials are absent the mailer degrades to logging the message
 * instead of throwing, so local dev works without a mailbox configured. The
 * magic-link / reset URLs are printed to the server console in that case.
 */
import nodemailer, { type Transporter } from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.mail.me.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Canker Core <no-reply@cankercore.com>';
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 10_000);

let transporter: Transporter | null = null;

function isConfigured(): boolean {
  return Boolean(SMTP_USERNAME && SMTP_PASSWORD);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD }
    });
  }
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  if (!isConfigured()) {
    console.warn(
      `[email] SMTP not configured — email not sent.\n  to: ${to}\n  subject: ${subject}\n  body:\n${text}`
    );
    return;
  }

  try {
    await Promise.race([
      getTransporter().sendMail({ from: EMAIL_FROM, to, subject, text, html: html ?? text }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP send timed out')), EMAIL_TIMEOUT_MS)
      )
    ]);
  } catch (err) {
    // Auth flows must not 500 because the mail hop failed; the caller still gets
    // a success response and the user can retry the request.
    console.error(`[email] failed to send "${subject}" to ${to}`, err);
  }
}

/** Minimal branded wrapper so the three auth emails look consistent. */
export function actionEmail(opts: {
  heading: string;
  body: string;
  buttonLabel: string;
  url: string;
}): { text: string; html: string } {
  const { heading, body, buttonLabel, url } = opts;
  return {
    text: `${heading}\n\n${body}\n\n${buttonLabel}: ${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 20px">${body}</p>
  <p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 20px;border-radius:6px;font-size:15px">${buttonLabel}</a></p>
  <p style="font-size:13px;color:#666;line-height:1.5;margin:0">If the button does not work, paste this link into your browser:<br><a href="${url}" style="color:#666;word-break:break-all">${url}</a></p>
  <p style="font-size:13px;color:#666;margin:20px 0 0">If you did not request this, you can ignore this email.</p>
</div>`
  };
}
