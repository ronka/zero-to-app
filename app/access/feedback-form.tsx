"use client";

import { FormEvent, useState } from "react";

import {
  FEATURE_REQUEST_BODY_LIMITS,
  FEATURE_REQUEST_TITLE_LIMITS,
  type FeatureRequestKind,
} from "@/lib/feedback/types";

const kinds: Array<{ value: FeatureRequestKind; label: string }> = [
  { value: "feature", label: "בקשת פיצ'ר" },
  { value: "bug", label: "באג" },
  { value: "feedback", label: "משוב כללי" },
];

const targets = [
  { value: "web", label: "תבנית ה־Web" },
  { value: "mobile", label: "תבנית ה־Mobile" },
  { value: "both", label: "שתי התבניות" },
  { value: "site", label: "האתר והפורטל" },
];

const fieldClass =
  "w-full rounded-xl border border-zinc-600 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[var(--lime)]";

export function FeedbackForm() {
  const [kind, setKind] = useState<FeatureRequestKind>("feature");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/feedback", { method: "POST", body: form });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
        setErrorMessage(
          typeof payload?.message === "string"
            ? payload.message
            : "לא הצלחנו לשלוח את הפנייה. נסו שוב בעוד כמה דקות.",
        );
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setErrorMessage("לא הצלחנו לשלוח את הפנייה. נסו שוב בעוד כמה דקות.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p
        className="mt-10 rounded-[24px] border border-[var(--lime)]/40 bg-[rgba(199,255,74,.07)] px-6 py-8 text-center text-lg font-bold leading-8 text-[var(--lime)]"
        role="status"
      >
        תודה! הבקשה נרשמה ואעבור עליה.
      </p>
    );
  }

  return (
    <form className="mt-10 max-w-2xl space-y-6" onSubmit={submit}>
      <fieldset>
        <legend className="font-bold">סוג הפנייה</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {kinds.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-5 py-3 text-sm font-bold transition ${
                kind === option.value
                  ? "border-[var(--lime)] bg-[rgba(199,255,74,.1)] text-[var(--lime)]"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block font-bold" htmlFor="feedback-target">
          על מה הפנייה?
        </label>
        <select className={`${fieldClass} mt-3 min-h-14`} id="feedback-target" name="target" defaultValue="web">
          {targets.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-bold" htmlFor="feedback-title">
          נושא
        </label>
        <input
          className={`${fieldClass} mt-3 min-h-14`}
          id="feedback-title"
          name="title"
          type="text"
          required
          minLength={FEATURE_REQUEST_TITLE_LIMITS.minimum}
          maxLength={FEATURE_REQUEST_TITLE_LIMITS.maximum}
        />
      </div>

      <div>
        <label className="block font-bold" htmlFor="feedback-body">
          מה תרצו שנוסיף או נתקן?
        </label>
        <textarea
          className={`${fieldClass} mt-3 leading-7`}
          id="feedback-body"
          name="body"
          rows={6}
          required
          minLength={FEATURE_REQUEST_BODY_LIMITS.minimum}
          maxLength={FEATURE_REQUEST_BODY_LIMITS.maximum}
        />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="feedback-website">Website</label>
        <input id="feedback-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        className="min-h-14 w-full rounded-full bg-[var(--lime)] px-6 font-black text-[var(--ink)] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10"
        disabled={state === "sending"}
        type="submit"
      >
        {state === "sending" ? "שולחים…" : state === "error" ? "נסו שוב" : "שליחת פנייה"}
      </button>

      {state === "error" && errorMessage ? (
        <p className="text-sm leading-6 text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
