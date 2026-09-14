import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authorizeAccess } from "@/lib/access/authorization";
import { auth } from "@/lib/auth";
import { claimEntitlement, findActiveEntitlement } from "@/lib/db";

const ENTITLEMENT_KEY = "zero-to-saas";

export default async function AccessPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const authorization = await authorizeAccess(session, ENTITLEMENT_KEY, {
    findEntitlement: findActiveEntitlement,
    claim: claimEntitlement,
  });
  if (authorization.status === "unverified") redirect("/auth/error");

  if (authorization.status === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-16">
        <section className="w-full max-w-lg rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <h1 className="text-4xl font-black">לא נמצאה גישה לחשבון הזה</h1>
          <p className="mt-4 leading-7 text-zinc-400">התחברו באימייל ששימש לרכישה. אם נפלה טעות בכתובת, פנו לתמיכה כדי שנוכל לבדוק אותה בבטחה.</p>
          <Link className="mt-8 inline-flex min-h-14 items-center rounded-full bg-[var(--lime)] px-7 font-black text-[var(--ink)]" href="/login">
            כניסה עם אימייל אחר
          </Link>
        </section>
      </main>
    );
  }

  const resources = [
    { label: "תבנית Web — Next.js", url: process.env.ACCESS_WEB_REPO_URL },
    { label: "תבנית Mobile — Expo", url: process.env.ACCESS_MOBILE_REPO_URL },
  ].filter((resource): resource is { label: string; url: string } => Boolean(resource.url));

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-16 md:py-24">
      <p className="font-mono text-sm font-bold text-[var(--lime)]">{"// ACCESS GRANTED"}</p>
      <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">הגישה פתוחה.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">שלום {session.user.name}. ההרשאה משויכת לאימייל המאומת של הרכישה.</p>
      {resources.length > 0 ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <a className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-xl font-black transition hover:border-[var(--lime)]" href={resource.url} key={resource.url} rel="noreferrer" target="_blank">
              {resource.label} ↗
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-zinc-300">
          הגישה שלכם פעילה. קישורי ההורדה יופיעו כאן לאחר הגדרת כתובות ה־repository בסביבת הייצור.
        </div>
      )}
    </main>
  );
}
