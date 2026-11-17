import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/** Normalises any user-typed phone number to E.164, defaulting to India. Returns null when invalid. */
export function toE164(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), "IN");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** OTP SMS is only sent to Indian mobiles: DLT templates are India-only and it blocks international SMS pumping. */
export function isIndianMobile(e164: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(e164);
}

export function formatPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

/** wa.me expects digits only, country code included. */
export function whatsappDigits(input: string): string | null {
  const e164 = toE164(input);
  return e164 ? e164.replace(/\D/g, "") : null;
}
