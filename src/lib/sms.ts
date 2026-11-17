import "server-only";
import { and, count, eq, gt } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { db } from "@/db";
import { smsLog } from "@/db/schema";
import { env } from "@/lib/env";

const PER_NUMBER_PER_HOUR = 5;
const ALL_NUMBERS_PER_HOUR = 500;

async function assertWithinLimits(phoneE164: string) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [[perNumber], [overall]] = await Promise.all([
    db.select({ value: count() }).from(smsLog).where(and(eq(smsLog.phone, phoneE164), gt(smsLog.createdAt, hourAgo))),
    db.select({ value: count() }).from(smsLog).where(gt(smsLog.createdAt, hourAgo)),
  ]);
  if ((perNumber?.value ?? 0) >= PER_NUMBER_PER_HOUR) {
    throw new APIError("TOO_MANY_REQUESTS", { message: "Too many codes sent to this number. Try again in an hour." });
  }
  if ((overall?.value ?? 0) >= ALL_NUMBERS_PER_HOUR) {
    console.error("[otp:sms] hourly SMS circuit breaker tripped");
    throw new APIError("SERVICE_UNAVAILABLE", { message: "We cannot send codes right now. Please try again shortly." });
  }
}

/** Sends an OTP via MSG91's DLT template (must contain ##OTP##) after per-number and overall caps; console mode only logs. */
export async function sendOtpSms(phoneE164: string, code: string): Promise<void> {
  await assertWithinLimits(phoneE164);
  await db.insert(smsLog).values({ phone: phoneE164 });

  if (env.otpDelivery === "console") {
    console.info(`[otp:sms] ${phoneE164} code=${code}`);
    return;
  }

  const { authKey, templateId } = env.msg91;
  if (!authKey || !templateId) throw new Error("MSG91 is not configured");

  const response = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify({
      template_id: templateId,
      mobile: phoneE164.replace(/^\+/, ""),
      otp: code,
    }),
  });

  if (!response.ok) {
    throw new Error(`MSG91 rejected the OTP request (${response.status})`);
  }
}
