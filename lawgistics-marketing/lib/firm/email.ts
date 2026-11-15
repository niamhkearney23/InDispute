import { q } from "./db";

// Invites by email, through Resend (https://resend.com), which has a free tier. It needs
// two settings: RESEND_API_KEY and EMAIL_FROM (an address on a domain verified in Resend,
// for example "Lawgistics <invites@yourdomain.com>"). If either is missing nothing here
// does anything, and the admin simply sends the invite themselves as before. An invite is
// ALWAYS created and shown on screen first, so a failed email can never lose one.

export function emailStatus(): { ok: true } | { ok: false; reason: string } {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: "RESEND_API_KEY is not set." };
  if (!process.env.EMAIL_FROM) return { ok: false, reason: "EMAIL_FROM is not set." };
  return { ok: true };
}

/** A normalised address, or null. Refuses anything that could smuggle a header or a second recipient. */
export function validEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return null;
  if (/[\s,;<>()\[\]\\"]/.test(e)) return null; // no spaces, no lists, no display names, no line breaks
  return /^[^@]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e) ? e : null;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type EmailResult = { sent: true } | { sent: false; why: "off" | "rejected" | "unreachable" | "limit" };

// A firm admin can only ever email people through this, and only with this one message.
// Even so, a cap keeps the platform from being used to spam a stranger with invites.
const PER_FIRM_PER_DAY = 30;

export async function sendInviteEmail(opts: {
  firmId: string;
  firmName: string;
  to: string;
  name: string;
  code: string;
  joinUrl: string;
  days: number;
}): Promise<EmailResult> {
  if (!emailStatus().ok) return { sent: false, why: "off" };

  const used = await q<{ n: number }>(
    `select count(*)::int as n from email_log where firm_id = $1 and created_at > now() - interval '24 hours'`,
    [opts.firmId],
  );
  if ((used[0]?.n ?? 0) >= PER_FIRM_PER_DAY) return { sent: false, why: "limit" };
  await q(`insert into email_log (firm_id) values ($1)`, [opts.firmId]);

  const first = opts.name.split(" ")[0] || "there";
  const origin = opts.joinUrl.split("/join#")[0];
  const text =
    `Hi ${first},\n\n` +
    `${opts.firmName} has added you to Lawgistics Marketing, where the firm's posts are written and reviewed.\n\n` +
    `Open this link to sign in on this device:\n${opts.joinUrl}\n\n` +
    `Or go to ${origin}/join and enter this code:\n${opts.code}\n\n` +
    `It works once and expires in ${opts.days} days. If you were not expecting this, you can ignore it.\n`;
  const html =
    `<p>Hi ${esc(first)},</p>` +
    `<p>${esc(opts.firmName)} has added you to Lawgistics Marketing, where the firm's posts are written and reviewed.</p>` +
    `<p><a href="${esc(opts.joinUrl)}">Open this link to sign in on this device</a></p>` +
    `<p>Or go to ${esc(origin)}/join and enter this code:<br><b style="font-family:monospace;font-size:16px">${esc(opts.code)}</b></p>` +
    `<p>It works once and expires in ${opts.days} days. If you were not expecting this, you can ignore it.</p>`;

  const base = (process.env.RESEND_API_BASE || "https://api.resend.com").replace(/\/+$/, "");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${base}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [opts.to],
        subject: `${opts.firmName}: your invite to Lawgistics Marketing`,
        text,
        html,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r.ok) return { sent: true };
    // a 4xx is a key or sender problem the owner has to fix, a 5xx is Resend having a bad moment
    return { sent: false, why: r.status >= 500 ? "unreachable" : "rejected" };
  } catch {
    return { sent: false, why: "unreachable" };
  }
}

export function emailNote(r: EmailResult | null): string | null {
  if (!r || r.sent) return null;
  if (r.why === "limit") return "Not emailed: this firm has sent its limit of invite emails for today. Send the code yourself.";
  if (r.why === "rejected") return "Could not email it: the email service refused the message. Send the code yourself.";
  return "Could not email it right now. Send the code yourself.";
}
