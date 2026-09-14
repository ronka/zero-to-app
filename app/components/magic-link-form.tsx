"use client";

import { FormEvent, useState } from "react";

type MagicLinkFormProps = {
  buttonLabel?: string;
};

export function MagicLinkForm({ buttonLabel = "שלחו לי קישור כניסה" }: MagicLinkFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    try {
      await fetch("/api/access/magic-link", { method: "POST", body: form });
    } finally {
      setState("sent");
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={submit}>
      <label className="block text-right font-bold" htmlFor="email">
        האימייל ששימש לרכישה
      </label>
      <input
        className="min-h-14 w-full rounded-xl border border-zinc-600 bg-black/25 px-4 text-left text-white outline-none transition focus:border-[var(--lime)]"
        dir="ltr"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        className="min-h-14 w-full rounded-full bg-[var(--lime)] px-6 font-black text-[var(--ink)] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
        disabled={state !== "idle"}
        type="submit"
      >
        {state === "sending" ? "שולחים…" : state === "sent" ? "בדקו את תיבת הדואר" : buttonLabel}
      </button>
      {state === "sent" ? (
        <p className="text-sm leading-6 text-zinc-400" role="status">
          אם קיימת רכישה מתאימה, קישור כניסה נשלח. בדקו גם את תיקיית הספאם.
        </p>
      ) : null}
    </form>
  );
}
