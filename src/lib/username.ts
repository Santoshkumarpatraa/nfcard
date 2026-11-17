export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]{1,28})[a-z0-9]$/;

// Profiles live at the site root, so every top-level route and likely future one is reserved.
const RESERVED = new Set([
  "about",
  "account",
  "activate",
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "business",
  "card",
  "cards",
  "cart",
  "checkout",
  "contact",
  "dashboard",
  "docs",
  "faq",
  "help",
  "home",
  "legal",
  "login",
  "logout",
  "media",
  "nfc",
  "orders",
  "pricing",
  "privacy",
  "profile",
  "register",
  "reset",
  "robots.txt",
  "settings",
  "shop",
  "signin",
  "signup",
  "sitemap.xml",
  "static",
  "store",
  "support",
  "t",
  "team",
  "teams",
  "terms",
  "verify",
  "www",
]);

export function normaliseUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function usernameProblem(input: string): string | null {
  const username = normaliseUsername(input);
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 30) return "Username must be at most 30 characters";
  if (!USERNAME_PATTERN.test(username))
    return "Use lowercase letters, numbers, dots or underscores. Start and end with a letter or number.";
  if (/[._]{2}/.test(username)) return "Dots and underscores cannot be next to each other";
  if (!/[a-z]/.test(username)) return "Username must include at least one letter";
  if (RESERVED.has(username)) return "This username is reserved";
  return null;
}
