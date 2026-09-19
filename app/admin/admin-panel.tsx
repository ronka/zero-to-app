"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  FEATURE_REQUEST_STATUSES,
  type FeatureRequestRecord,
  type FeatureRequestStatus,
} from "@/lib/feedback/types";

const statusLabels: Record<FeatureRequestStatus, string> = {
  new: "חדש",
  triaged: "נבדק",
  planned: "מתוכנן",
  shipped: "נשלח",
  declined: "נדחה",
};

const statusStyles: Record<FeatureRequestStatus, string> = {
  new: "border-[var(--lime)]/50 bg-[rgba(199,255,74,.1)] text-[var(--lime)]",
  triaged: "border-[var(--sky)]/50 bg-[rgba(109,216,255,.1)] text-[var(--sky)]",
  planned: "border-amber-400/50 bg-amber-400/10 text-amber-300",
  shipped: "border-emerald-400/50 bg-emerald-400/10 text-emerald-300",
  declined: "border-zinc-600 bg-white/5 text-zinc-400",
};

const kindLabels = { feature: "פיצ'ר", bug: "באג", feedback: "משוב" } as const;
const targetLabels = { web: "Web", mobile: "Mobile", both: "שתיהן", site: "האתר" } as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RequestCard({ request }: { request: FeatureRequestRecord }) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.note ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dirty = status !== request.status || note !== (request.note ?? "");

  async function save() {
    setState("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status, note }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
        // An unauthenticated save answers 404 with no message; the likeliest
        // cause is an expired session on a long-open tab, so say that.
        setErrorMessage(
          typeof payload?.message === "string"
            ? payload.message
            : "השמירה נכשלה. ייתכן שפג תוקף ההתחברות — רעננו את הדף.",
        );
        setState("error");
        return;
      }
      setState("saved");
      router.refresh();
    } catch {
      setErrorMessage("השמירה נכשלה. בדקו את החיבור ונסו שוב.");
      setState("error");
    }
  }

  return (
    <article className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className={`rounded-full border px-3 py-1 ${statusStyles[request.status]}`}>
          {statusLabels[request.status]}
        </span>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400">
          {kindLabels[request.kind]}
        </span>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400" dir="ltr">
          {targetLabels[request.target]}
        </span>
        <span className="text-zinc-500" dir="ltr">
          {formatDate(request.createdAt)}
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-black tracking-tight">{request.title}</h2>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-300">{request.body}</p>

      <a
        className="mt-4 inline-block font-mono text-sm text-[var(--sky)] underline-offset-4 hover:underline"
        dir="ltr"
        href={`mailto:${request.subjectEmail}?subject=${encodeURIComponent(`Zero to App — ${request.title}`)}`}
      >
        {request.subjectEmail}
      </a>

      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <label className="block text-sm font-bold" htmlFor={`status-${request.id}`}>
            סטטוס
          </label>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600 bg-black/25 px-3 text-white outline-none transition focus:border-[var(--lime)]"
            id={`status-${request.id}`}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as FeatureRequestStatus);
              setState("idle");
            }}
          >
            {FEATURE_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-bold" htmlFor={`note-${request.id}`}>
            הערה פנימית
          </label>
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-zinc-600 bg-black/25 px-3 text-white outline-none transition focus:border-[var(--lime)]"
            id={`note-${request.id}`}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setState("idle");
            }}
            maxLength={2000}
          />
        </div>

        <button
          className="min-h-12 shrink-0 rounded-full bg-[var(--lime)] px-6 font-black text-[var(--ink)] transition enabled:hover:-translate-y-0.5 disabled:opacity-40"
          disabled={!dirty || state === "saving"}
          onClick={save}
          type="button"
        >
          {state === "saving" ? "שומרים…" : state === "saved" && !dirty ? "נשמר ✓" : "שמירה"}
        </button>
      </div>

      {state === "error" && errorMessage ? (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {state === "saved" && !dirty ? (
        <p className="mt-3 text-sm text-zinc-500" role="status">
          נשמר.
        </p>
      ) : null}
    </article>
  );
}

export function AdminPanel({ requests }: { requests: FeatureRequestRecord[] }) {
  const counts = FEATURE_REQUEST_STATUSES.map((status) => ({
    status,
    count: requests.filter((request) => request.status === status).length,
  })).filter((entry) => entry.count > 0);

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-5 py-14 md:px-8">
      <p className="font-mono text-sm font-bold text-[var(--coral)]">{"// ADMIN"}</p>
      <h1 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-5xl">פניות מהבונים</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400">
          {requests.length} סה״כ
        </span>
        {counts.map((entry) => (
          <span
            key={entry.status}
            className={`rounded-full border px-3 py-1 ${statusStyles[entry.status]}`}
          >
            {statusLabels[entry.status]} · {entry.count}
          </span>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="mt-12 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center text-lg text-zinc-400">
          עדיין לא נשלחו פניות.
        </p>
      ) : (
        <div className="mt-10 space-y-5">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </main>
  );
}
