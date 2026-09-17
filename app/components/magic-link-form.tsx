"use client";

import { FormEvent, useState } from "react";

type MagicLinkFormProps = {
  buttonLabel?: string;
};

export function MagicLinkForm({ buttonLabel = "שלחו לי קישור כניסה" }: MagicLinkFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/access/magic-link", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
        setErrorMessage(
          typeof payload?.message === "string"
            ? payload.message
            : "לא הצלחנו לשלוח את הקישור. נסו שוב בעוד כמה דקות.",
        );
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setErrorMessage("לא הצלחנו לשלוח את הקישור. נסו שוב בעוד כמה דקות.");
      setState("error");
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
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        className="min-h-14 w-full rounded-full bg-[var(--lime)] px-6 font-black text-[var(--ink)] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
        disabled={state === "sending" || state === "sent"}
        type="submit"
      >
        {state === "sending"
          ? "שולחים…"
          : state === "sent"
            ? "בדקו את תיבת הדואר"
            : state === "error"
              ? "נסו שוב"
              : buttonLabel}
      </button>
      {state === "sent" ? (
        <p className="text-sm leading-6 text-zinc-400" role="status">
          אם קיימת רכישה מתאימה, קישור כניסה נשלח. בדקו גם את תיקיית הספאם.
        </p>
      ) : null}
      {state === "error" && errorMessage ? (
        <p className="text-sm leading-6 text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
