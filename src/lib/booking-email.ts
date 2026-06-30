import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

/**
 * Audit-booking emails via Amazon SES (sesv2) — owner notification + reader ack.
 * Sent from the DKIM-verified zephyrcode.live identity (ap-south-1) using a dedicated
 * least-privilege IAM user (zc-ses-mailer, ses:SendEmail on that identity only).
 * Best-effort: a send failure NEVER fails the booking. No-op if creds are absent
 * (e.g. local without env). Creds: SES_REGION / SES_ACCESS_KEY_ID / SES_SECRET_ACCESS_KEY.
 */
type Booking = {
  name: string;
  email: string;
  company?: string | null;
  audit_sku?: string | null;
  audit_title?: string | null;
  message?: string | null;
};

const FROM = process.env.EMAIL_FROM || "ZephyrCode Audits <audits@zephyrcode.live>";
const OWNER = process.env.OWNER_EMAIL || "priyanshu@zephyrcode.live";
const REGION = process.env.SES_REGION || "ap-south-1";

const esc = (s: string) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let _client: SESv2Client | null = null;
function client(): SESv2Client | null {
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null; // not configured → silent no-op
  if (!_client) _client = new SESv2Client({ region: REGION, credentials: { accessKeyId, secretAccessKey } });
  return _client;
}

function send(
  c: SESv2Client,
  opts: { to: string; replyTo?: string; subject: string; text: string; html?: string }
) {
  return c.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [opts.to] },
      ReplyToAddresses: opts.replyTo ? [opts.replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: opts.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: opts.text, Charset: "UTF-8" },
            ...(opts.html ? { Html: { Data: opts.html, Charset: "UTF-8" } } : {}),
          },
        },
      },
    })
  );
}

export async function sendBookingEmails(b: Booking): Promise<{ sent: boolean; reason?: string }> {
  const c = client();
  if (!c) return { sent: false, reason: "no_ses_creds" };

  const audit = b.audit_title
    ? `${b.audit_title}${b.audit_sku ? ` (${b.audit_sku})` : ""}`
    : "Not sure yet — point me to the right one";
  const first = (b.name || "").split(" ")[0] || b.name;

  try {
    // 1) owner notification — reply-to the prospect so a reply goes straight to them
    await send(c, {
      to: OWNER,
      replyTo: b.email,
      subject: `New audit booking — ${audit} · ${b.name}`,
      text: [
        `New booking from the audits page.`,
        ``,
        `Name:    ${b.name}`,
        `Email:   ${b.email}`,
        `Company: ${b.company || "—"}`,
        `Audit:   ${audit}`,
        ``,
        `What's keeping them up:`,
        b.message || "(none provided)",
      ].join("\n"),
    });

    // 2) reader acknowledgement
    await send(c, {
      to: b.email,
      replyTo: OWNER,
      subject: `Got your audit request — I'll revert within a business day`,
      text: [
        `Hi ${first},`,
        ``,
        `Thanks — your request for "${audit}" came straight to me. I read every one of these myself and I'll reply within one business day with the next step, or an honest "you don't need an audit."`,
        ``,
        `— Priyanshu · ZephyrCode`,
        `priyanshu@zephyrcode.live`,
      ].join("\n"),
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#0A0C0F;color:#EEF2F6;max-width:520px;margin:0 auto;padding:34px 26px;line-height:1.6;border-radius:12px;">
  <p style="margin:0 0 6px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#3DE1E6;">ZephyrCode · Engineering Audits</p>
  <h1 style="margin:0 0 16px;font-size:21px;font-weight:600;color:#ffffff;">Got it — message received.</h1>
  <p style="margin:0 0 16px;color:#AEB8C4;">Hi ${esc(first)}, thanks. Your request for <strong style="color:#EEF2F6;">${esc(audit)}</strong> came straight to me. I read every one of these myself and I'll reply <strong style="color:#3DE1E6;">within one business day</strong> with the next step — or an honest "you don't need an audit."</p>
  <p style="margin:0;color:#8593A2;font-size:14px;">— Priyanshu · ZephyrCode<br/>priyanshu@zephyrcode.live</p>
</div>`,
    });
    return { sent: true };
  } catch {
    return { sent: false, reason: "send_error" };
  }
}
