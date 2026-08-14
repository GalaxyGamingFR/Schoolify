import "server-only";
import { Resend } from "resend";

// Falls back to Resend's sandbox address until a real domain is verified
// (Vercel Marketplace → Resend → Domains) -- the sandbox can only deliver
// to the account owner's own address, so this silently no-ops instead of
// erroring out until that's set up, since a failed notification email
// should never block the admin action that triggered it.
const FROM = process.env.EMAIL_FROM ?? "Schoolify <onboarding@resend.dev>";

let resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function send(to: string, subject: string, html: string) {
  const client = getResend();
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return;
  }
  const { error } = await client.emails.send({ from: FROM, to: [to], subject, html });
  if (error) console.error(`[email] Failed to send "${subject}" to ${to}:`, error.message);
}

function wrapper(title: string, body: string) {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h1 style="font-size:18px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#71717a">Schoolify</p>
  </div>`;
}

export async function sendSuspensionEmail(to: string, name: string) {
  await send(
    to,
    "Your Schoolify account has been suspended",
    wrapper(
      "Account suspended",
      `<p style="font-size:14px;color:#3f3f46">Hi ${name},</p>
       <p style="font-size:14px;color:#3f3f46">Your Schoolify account has been suspended by an administrator. You won't be able to sign in until it's reactivated.</p>
       <p style="font-size:14px;color:#3f3f46">If you think this is a mistake, reply to this email or contact therealtariqkhalif@gmail.com.</p>`,
    ),
  );
}

export async function sendReactivationEmail(to: string, name: string) {
  await send(
    to,
    "Your Schoolify account has been reactivated",
    wrapper(
      "Account reactivated",
      `<p style="font-size:14px;color:#3f3f46">Hi ${name},</p>
       <p style="font-size:14px;color:#3f3f46">Good news — your Schoolify account has been reactivated. You can sign in as usual.</p>`,
    ),
  );
}
