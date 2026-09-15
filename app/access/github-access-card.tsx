"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export type RepositoryAccessView = {
  id: "web" | "mobile";
  title: string;
  slug: string;
  state: "provisioning" | "invited" | "active" | "failed" | "revoked" | null;
  invitationUrl: string | null;
};

type Props = {
  configured: boolean;
  linked: boolean;
  login: string | null;
  repositories: RepositoryAccessView[];
  shouldProvision: boolean;
  connectionError: boolean;
};

const stateLabels = {
  provisioning: "מכינים גישה…",
  invited: "ההזמנה ממתינה לאישור",
  active: "הגישה פעילה ✓",
  failed: "ההענקה נכשלה",
  revoked: "הגישה בוטלה",
} as const;

export function GitHubAccessCard({
  configured,
  linked,
  login,
  repositories,
  shouldProvision,
  connectionError,
}: Props) {
  const router = useRouter();
  const automaticAttempted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    connectionError ? "החיבור ל־GitHub לא הושלם. אפשר לנסות שוב." : null,
  );

  const provision = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/access/github/provision", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "GitHub access could not be provisioned");
      }
      router.replace("/access", { scroll: false });
      router.refresh();
    } catch {
      setMessage("לא הצלחנו להעניק גישה כרגע. אפשר לנסות שוב בעוד רגע.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (!shouldProvision || !linked || automaticAttempted.current) return;
    automaticAttempted.current = true;
    void provision();
  }, [linked, provision, shouldProvision]);

  async function connect() {
    setBusy(true);
    setMessage(null);
    const result = await authClient.linkSocial({
      provider: "github",
      callbackURL: "/access?github=connected",
      errorCallbackURL: "/access?github=error",
    });
    if (result.error) {
      setMessage("החיבור ל־GitHub לא הושלם. נסו שוב.");
      setBusy(false);
    }
  }

  const allActive = repositories.every((repository) => repository.state === "active");
  const hasInvitation = repositories.some((repository) => repository.state === "invited");

  return (
    <section className="mt-10 rounded-[28px] border border-[var(--lime)]/40 bg-[rgba(199,255,74,.06)] p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs font-bold text-[var(--lime)]">{"// GITHUB ACCESS"}</p>
          <h3 className="mt-3 text-2xl font-black md:text-3xl">
            {allActive ? "הגישה ל־GitHub פעילה" : "חברו GitHub וקבלו גישה"}
          </h3>
          <p className="mt-2 max-w-2xl leading-7 text-zinc-400">
            {linked
              ? `החשבון ${login ? `@${login}` : "שלכם"} מחובר. ההרשאה היא לקריאה בלבד ב־repos של התבניות.`
              : "החיבור מזהה את חשבון ה־GitHub שלכם. הזכאות נשארת קשורה לרכישה המאומתת באימייל."}
          </p>
        </div>

        {!configured ? (
          <span className="rounded-full border border-amber-400/40 px-5 py-3 text-sm font-bold text-amber-300">
            ההגדרה תושלם בקרוב
          </span>
        ) : !linked ? (
          <button
            className="min-h-12 shrink-0 rounded-full bg-white px-6 text-sm font-black text-black transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onClick={connect}
            type="button"
          >
            {busy ? "עוברים ל־GitHub…" : "חיבור עם GitHub"}
          </button>
        ) : !allActive ? (
          <button
            className="min-h-12 shrink-0 rounded-full bg-[var(--lime)] px-6 text-sm font-black text-[var(--ink)] transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onClick={() => void provision()}
            type="button"
          >
            {busy ? "בודקים גישה…" : hasInvitation ? "בדיקת גישה מחדש" : "הענקת גישה ל־repos"}
          </button>
        ) : null}
      </div>

      {linked ? (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {repositories.map((repository) => (
            <li key={repository.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div>
                <p className="font-bold">{repository.title}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500" dir="ltr">{repository.slug}</p>
              </div>
              {repository.state === "invited" && repository.invitationUrl ? (
                <a className="shrink-0 text-sm font-black text-[var(--lime)] hover:underline" href={repository.invitationUrl} target="_blank" rel="noreferrer">
                  אישור ב־GitHub ↗
                </a>
              ) : (
                <span className={repository.state === "active" ? "text-sm font-bold text-[var(--lime)]" : "text-sm font-bold text-zinc-400"}>
                  {repository.state ? stateLabels[repository.state] : "עדיין לא הוענקה"}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {message ? <p className="mt-4 text-sm font-bold text-[var(--coral)]" role="alert">{message}</p> : null}
    </section>
  );
}
