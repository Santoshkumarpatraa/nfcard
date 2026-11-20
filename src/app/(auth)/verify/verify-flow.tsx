"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { OtpInput, useCooldown } from "@/components/otp-input";
import { Alert, Button, Field, Input } from "@/components/ui";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { formatPhone, isIndianMobile, toE164 } from "@/lib/phone";
import { useNextParam } from "@/lib/use-next-param";

export function VerifyFlow() {
  const router = useRouter();
  const next = useNextParam();
  const { data: session, isPending, refetch } = authClient.useSession();
  const [skippedEmail, setSkippedEmail] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace(`/login?next=${encodeURIComponent(`/verify?next=${encodeURIComponent(next)}`)}`);
  }, [isPending, session, router, next]);

  const user = session?.user;
  const phoneDone = Boolean(user?.phoneNumberVerified);
  const emailDone = Boolean(user?.emailVerified) || skippedEmail;

  useEffect(() => {
    // Full page load, as after login: pages seen before verifying were redirects and must not come back from the router cache.
    if (user && phoneDone && emailDone) window.location.assign(next);
  }, [user, phoneDone, emailDone, next]);

  if (!user) return <p className="text-sm text-ink-500">Loading...</p>;

  return (
    <div>
      <Steps phoneDone={phoneDone} emailDone={Boolean(user.emailVerified)} />
      {!phoneDone ? (
        <PhoneStep onVerified={() => refetch()} />
      ) : !emailDone ? (
        <EmailStep email={user.email} onVerified={() => refetch()} onSkip={() => setSkippedEmail(true)} />
      ) : (
        <p className="mt-8 text-sm text-ink-500">All set. Taking you to your dashboard...</p>
      )}
    </div>
  );
}

function Steps({ phoneDone, emailDone }: { phoneDone: boolean; emailDone: boolean }) {
  const step = (label: string, done: boolean, active: boolean) => (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-emerald-600 text-white" : active ? "bg-ink-950 text-white" : "bg-ink-100 text-ink-500"
        }`}
      >
        {done ? <Icon name="check" size={14} strokeWidth={2.5} /> : label[0]}
      </span>
      <span className={`text-sm ${active || done ? "text-ink-900" : "text-ink-500"}`}>{label}</span>
    </div>
  );
  return (
    <div className="mb-8 flex items-center gap-4">
      {step("Phone", phoneDone, !phoneDone)}
      <span className="h-px flex-1 bg-ink-200" />
      {step("Email", emailDone, phoneDone && !emailDone)}
    </div>
  );
}

function PhoneStep({ onVerified }: { onVerified: () => void }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cooldown = useCooldown(sentAt);

  async function send(target: string) {
    setPending(true);
    setError(null);
    const result = await authClient.phoneNumber.sendOtp({ phoneNumber: target });
    setPending(false);
    if (result.error) {
      setError(authErrorMessage(result.error, "Could not send the code"));
      return false;
    }
    setPhone(target);
    setSentAt(Date.now());
    return true;
  }

  async function onRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("phone") ?? "");
    const e164 = toE164(raw);
    if (!e164 || !isIndianMobile(e164)) {
      setError("Enter a valid Indian mobile number");
      return;
    }
    await send(e164);
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone) return;
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setPending(true);
    setError(null);
    const result = await authClient.phoneNumber.verify({ phoneNumber: phone, code, updatePhoneNumber: true });
    setPending(false);
    if (result.error) {
      setError(authErrorMessage(result.error, "That code did not work"));
      return;
    }
    onVerified();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Verify your phone</h1>
      <p className="mt-2 text-sm text-ink-500">
        {phone ? `Enter the code we sent to ${formatPhone(phone)}.` : "We will text you a 6-digit code."}
      </p>
      <div className="mt-8 flex flex-col gap-5">
        {error ? <Alert>{error}</Alert> : null}
        {!phone ? (
          <form onSubmit={onRequest} className="flex flex-col gap-5">
            <Field label="Mobile number" htmlFor="phone" hint="Indian numbers can skip +91">
              <Input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="98765 43210" />
            </Field>
            <Button type="submit" disabled={pending} className="py-3">
              {pending ? "Sending..." : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="flex flex-col gap-5">
            <OtpInput />
            <Button type="submit" disabled={pending} className="py-3">
              {pending ? "Verifying..." : "Verify"}
            </Button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-ink-500 hover:text-ink-900" onClick={() => setPhone(null)}>
                Change number
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || pending}
                className="font-medium text-ink-900 disabled:text-ink-400"
                onClick={() => send(phone)}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function EmailStep({ email, onVerified, onSkip }: { email: string; onVerified: () => void; onSkip: () => void }) {
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cooldown = useCooldown(sentAt);

  async function send() {
    setPending(true);
    setError(null);
    const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    setPending(false);
    if (result.error) {
      setError(authErrorMessage(result.error, "Could not send the code"));
      return;
    }
    setSentAt(Date.now());
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = String(new FormData(event.currentTarget).get("code") ?? "");
    setPending(true);
    setError(null);
    const result = await authClient.emailOtp.verifyEmail({ email, otp });
    setPending(false);
    if (result.error) {
      setError(authErrorMessage(result.error, "That code did not work"));
      return;
    }
    onVerified();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Verify your email</h1>
      <p className="mt-2 text-sm text-ink-500">
        {sentAt ? `Enter the code we sent to ${email}.` : `We will send a code to ${email}. Needed for lead alerts and receipts.`}
      </p>
      <div className="mt-8 flex flex-col gap-5">
        {error ? <Alert>{error}</Alert> : null}
        {sentAt === null ? (
          <Button onClick={send} disabled={pending} className="py-3">
            {pending ? "Sending..." : "Send code"}
          </Button>
        ) : (
          <form onSubmit={onVerify} className="flex flex-col gap-5">
            <OtpInput />
            <Button type="submit" disabled={pending} className="py-3">
              {pending ? "Verifying..." : "Verify email"}
            </Button>
            <button
              type="button"
              disabled={cooldown > 0 || pending}
              className="text-sm font-medium text-ink-900 disabled:text-ink-400"
              onClick={send}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}
        <button type="button" onClick={onSkip} className="text-sm text-ink-500 hover:text-ink-900">
          Skip for now
        </button>
      </div>
    </>
  );
}
