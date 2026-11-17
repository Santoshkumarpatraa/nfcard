import "server-only";
import { env } from "@/lib/env";
import { site } from "@/lib/site";

type Email = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** Sends an email through Resend. In console mode it only logs, so development never emails anyone. */
export async function sendEmail(email: Email): Promise<void> {
  if (env.otpDelivery === "console") {
    console.info(`[email] to=${email.to} subject="${email.subject}"\n${email.text}`);
    return;
  }

  if (!env.resend.apiKey) throw new Error("Resend is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.resend.apiKey}`,
    },
    body: JSON.stringify({
      from: env.resend.from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the email (${response.status})`);
  }
}

const OTP_PURPOSE: Record<string, string> = {
  "email-verification": "verify your email",
  "forget-password": "reset your password",
  "sign-in": "sign in",
  "change-email": "confirm your new email",
};

export async function sendOtpEmail(to: string, otp: string, type: string): Promise<void> {
  const purpose = OTP_PURPOSE[type] ?? "continue";
  await sendEmail({
    to,
    subject: `${otp} is your ${site.name} code`,
    text: `Use ${otp} to ${purpose}. The code expires in 10 minutes. If you did not request it, you can ignore this email.`,
  });
}
