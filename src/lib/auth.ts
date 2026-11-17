import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, phoneNumber, username } from "better-auth/plugins";
import { db, schema } from "@/db";
import { sendOtpEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { isIndianMobile, toE164 } from "@/lib/phone";
import { site } from "@/lib/site";
import { sendOtpSms } from "@/lib/sms";
import { usernameProblem } from "@/lib/username";

const OTP_TTL_SECONDS = 600;
const OTP_ATTEMPTS = 5;

// Fields that only change through dashboard actions, which also refresh the public page cache.
const PROTECTED_USER_FIELDS = ["username", "displayUsername", "phoneNumber"];

function bodyHas(body: unknown, key: string): boolean {
  return typeof body === "object" && body !== null && key in body;
}

const guard = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-up/email") {
    if (!bodyHas(ctx.body, "username")) throw new APIError("BAD_REQUEST", { message: "Choose a username" });
    if (bodyHas(ctx.body, "phoneNumber")) throw new APIError("BAD_REQUEST", { message: "Add your phone after sign up" });
  }
  if (ctx.path === "/update-user" && PROTECTED_USER_FIELDS.some((key) => bodyHas(ctx.body, key))) {
    throw new APIError("BAD_REQUEST", { message: "Change this from your dashboard settings" });
  }
  if (ctx.path === "/phone-number/send-otp" && !(await getSessionFromCtx(ctx))) {
    throw new APIError("UNAUTHORIZED", { message: "Please sign in again" });
  }
  if (ctx.path === "/email-otp/send-verification-otp" && bodyHas(ctx.body, "type")) {
    const body: { type?: unknown } = ctx.body;
    if (body.type === "sign-in") throw new APIError("BAD_REQUEST", { message: "Sign in with your password" });
  }
});

export const auth = betterAuth({
  appName: site.name,
  baseURL: env.siteUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    },
  }),
  // Password is the only way in; one-time codes are for verification and resets, never for login.
  disabledPaths: ["/sign-in/email-otp"],
  hooks: { before: guard },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "user", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Cookie caching stays off: verification flags change mid-session and must be read fresh.
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/phone-number/send-otp": { window: 60, max: 3 },
      "/phone-number/verify": { window: 60, max: 10 },
      "/phone-number/request-password-reset": { window: 60, max: 3 },
      "/phone-number/reset-password": { window: 60, max: 10 },
      "/email-otp/verify-email": { window: 60, max: 10 },
      "/email-otp/reset-password": { window: 60, max: 10 },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (value) => usernameProblem(value) === null,
    }),
    phoneNumber({
      otpLength: 6,
      expiresIn: OTP_TTL_SECONDS,
      allowedAttempts: OTP_ATTEMPTS,
      phoneNumberValidator: (value) => toE164(value) === value && isIndianMobile(value),
      sendOTP: ({ phoneNumber: phone, code }) => sendOtpSms(phone, code),
      sendPasswordResetOTP: ({ phoneNumber: phone, code }) => sendOtpSms(phone, code),
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: OTP_TTL_SECONDS,
      allowedAttempts: OTP_ATTEMPTS,
      storeOTP: "hashed",
      disableSignUp: true,
      sendVerificationOTP: ({ email, otp, type }) => sendOtpEmail(email, otp, type),
    }),
    // Must stay last so cookies set inside server actions reach the browser.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
