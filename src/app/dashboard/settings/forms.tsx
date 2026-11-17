"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeUsername } from "@/app/dashboard/actions";
import { Alert, Button, Field, Input } from "@/components/ui";
import { authClient, authErrorMessage } from "@/lib/auth-client";

type Message = { ok: boolean; text: string } | null;

export function UsernameForm({ current }: { current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("username") ?? "");
        startTransition(async () => {
          const result = await changeUsername(value);
          setMessage(result.ok ? { ok: true, text: result.message ?? "Saved" } : { ok: false, text: result.error });
          if (result.ok) router.refresh();
        });
      }}
    >
      {message ? <Alert tone={message.ok ? "success" : "error"}>{message.text}</Alert> : null}
      <div className="flex gap-2">
        <Input name="username" defaultValue={current} required autoCapitalize="none" spellCheck={false} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    const result = await authClient.changePassword({
      currentPassword: String(form.get("current") ?? ""),
      newPassword: String(form.get("next") ?? ""),
      revokeOtherSessions: true,
    });
    setPending(false);
    if (result.error) {
      setMessage({ ok: false, text: authErrorMessage(result.error, "Could not change password") });
      return;
    }
    formElement.reset();
    setMessage({ ok: true, text: "Password changed. Other devices were signed out." });
  }

  return (
    <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit}>
      {message ? <Alert tone={message.ok ? "success" : "error"}>{message.text}</Alert> : null}
      <Field label="Current password" htmlFor="current">
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="next" hint="At least 8 characters">
        <Input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
