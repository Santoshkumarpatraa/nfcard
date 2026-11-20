import "server-only";

const isProduction = process.env.NODE_ENV === "production";

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProduction && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable ${name}`);
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value ? value : undefined;
}

function oneOf<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = optional(name);
  if (value === undefined) return fallback;
  const match = allowed.find((option) => option === value);
  if (!match) throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
  return match;
}

export const env = {
  isProduction,
  siteUrl: required("NEXT_PUBLIC_SITE_URL", "http://localhost:3400"),
  databaseUrl: required("DATABASE_URL", "postgres://localhost:5432/nfcard_local"),
  otpDelivery: oneOf("OTP_DELIVERY", ["live", "console"], isProduction ? "live" : "console"),
  msg91: {
    authKey: optional("MSG91_AUTH_KEY"),
    templateId: optional("MSG91_OTP_TEMPLATE_ID"),
    senderId: optional("MSG91_SENDER_ID"),
  },
  resend: {
    apiKey: optional("RESEND_API_KEY"),
    from: optional("EMAIL_FROM") ?? "NFCard <hello@example.com>",
  },
  storage: {
    // Production defaults to the database driver so uploads work on read-only hosts before R2 is set up.
    driver: oneOf("STORAGE_DRIVER", ["local", "s3", "db"], isProduction ? "db" : "local"),
    endpoint: optional("S3_ENDPOINT"),
    region: optional("S3_REGION") ?? "auto",
    bucket: optional("S3_BUCKET"),
    accessKeyId: optional("S3_ACCESS_KEY_ID"),
    secretAccessKey: optional("S3_SECRET_ACCESS_KEY"),
  },
  cronSecret: optional("CRON_SECRET"),
  razorpay: {
    keyId: optional("RAZORPAY_KEY_ID"),
    keySecret: optional("RAZORPAY_KEY_SECRET"),
    webhookSecret: optional("RAZORPAY_WEBHOOK_SECRET"),
  },
};
