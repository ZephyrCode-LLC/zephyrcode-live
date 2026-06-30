import "server-only";

/**
 * Audit-booking emails — an owner notification + a reader acknowledgement.
 * Resend REST (no SDK). GATED on RESEND_API_KEY: with no key set this is a silent
 * no-op, so the booking still saves and the on-screen ack still shows; email turns
 * on the moment the key is configured. A send failure NEVER affects the request.
 *
 * To go live (operator): set RESEND_API_KEY in the Amplify env and verify
 * zephyrcode.live as a sending domain in Resend (keeps Google MX for inbound;
 * Resend adds its own SPF/DKIM). Optional: EMAIL_FROM, OWNER_EMAIL.
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

const esc = (s: string) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function send(key: string, payload: Record<string, unknown>) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendBookingEmails(b: Booking): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "no_api_key" }; // not configured yet — silent no-op

  const audit = b.audit_title
    ? `${b.audit_title}${b.audit_sku ? ` (${b.audit_sku})` : ""}`
    : "Not sure yet — point me to the right one";
  const first = (b.name || "").split(" ")[0] || b.name;

  try {
    // 1) owner notification (reply-to the prospect so a reply goes straight to them)
    await send(key, {
      from: FROM,
      to: [OWNER],
      reply_to: b.email,
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
    await send(key, {
      from: FROM,
      to: [b.email],
      reply_to: OWNER,
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
