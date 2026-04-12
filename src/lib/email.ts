import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

// Sender address — using Resend test domain until custom domain is verified
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "Winhoop CRM <onboarding@resend.dev>";
export const EMAIL_REPLY_TO = "wilfred@stannumcan.com";
