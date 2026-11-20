// Premium unlocks business sections, themes and analytics; the card and basic profile always keep working.
export const PREMIUM_MONTHS_METAL = 12;
export const PREMIUM_MONTHS_PVC = 6;
export const RENEWAL_MONTHS = 12;

export function isPremium(premiumUntil: Date | string | null | undefined, now = Date.now()): boolean {
  if (!premiumUntil) return false;
  return new Date(premiumUntil).getTime() > now;
}

/** Free Premium months that come with a card, judged by product slug or card label. */
export function premiumMonthsFor(product: string): number {
  return /metal/i.test(product) ? PREMIUM_MONTHS_METAL : PREMIUM_MONTHS_PVC;
}

export function daysUntil(value: Date | string | null | undefined, now = Date.now()): number {
  return value ? Math.ceil((new Date(value).getTime() - now) / 86_400_000) : 0;
}

export function formatPlanDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(
    new Date(value),
  );
}
