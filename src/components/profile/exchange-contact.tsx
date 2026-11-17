"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";

type Status = "idle" | "sending" | "sent" | "error";

export function ExchangeContact({
  profileId,
  cardId,
  ownerFirstName,
}: {
  profileId: string;
  cardId?: string;
  ownerFirstName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError(null);

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        cardId,
        name: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email"),
        company: form.get("company"),
        note: form.get("note"),
        website: form.get("website"),
      }),
    }).catch(() => null);

    if (response?.ok) {
      setStatus("sent");
      return;
    }
    const body: { error?: string } | null = response ? await response.json().catch(() => null) : null;
    setError(body?.error ?? "Could not send. Check your connection and try again.");
    setStatus("error");
  }

  const input =
    "w-full rounded-xl border border-p-border bg-p-bg px-4 py-3 text-base text-p-text sm:text-[15px] placeholder:text-p-muted/70 focus:border-p-accent focus:outline-none";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          nameRef.current?.focus();
        }}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-p-border bg-p-surface px-4 py-4 text-[15px] font-semibold"
      >
        <Icon name="exchange" size={18} /> Share yours
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setStatus("idle");
          setError(null);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[min(92vw,420px)] rounded-3xl border border-p-border bg-p-surface p-0 text-p-text backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Share your details</h2>
              <p className="mt-1 text-sm text-p-muted">
                {ownerFirstName} will get your contact so you can stay in touch.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full p-1.5 text-p-muted"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {status === "sent" ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-p-accent text-p-accent-text">
                <Icon name="check" size={22} />
              </div>
              <p className="mt-4 font-medium">Sent. Thank you!</p>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="mt-6 w-full rounded-xl bg-p-accent px-4 py-3 text-sm font-semibold text-p-accent-text"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
              <input ref={nameRef} name="name" required maxLength={80} placeholder="Your name" autoComplete="name" className={input} />
              <input name="phone" type="tel" maxLength={20} placeholder="Phone" autoComplete="tel" className={input} />
              <input name="email" type="email" maxLength={120} placeholder="Email" autoComplete="email" className={input} />
              <p className="-mt-1 text-xs text-p-muted">Add a phone number or email, or both.</p>
              <input name="company" maxLength={80} placeholder="Company (optional)" autoComplete="organization" className={input} />
              <textarea name="note" maxLength={500} rows={2} placeholder="Note (optional)" className={input} />
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-1 rounded-xl bg-p-accent px-4 py-3.5 text-[15px] font-semibold text-p-accent-text disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Send"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
