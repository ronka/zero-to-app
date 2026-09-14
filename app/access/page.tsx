import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authorizeAccess } from "@/lib/access/authorization";
import { auth } from "@/lib/auth";
import { claimEntitlement, findActiveEntitlement } from "@/lib/db";

import { ProductAccess } from "./product-access";

const ENTITLEMENT_KEY = "zero-to-saas";

export const metadata: Metadata = {
  title: "הגישה שלכם — Zero to SaaS",
  robots: { index: false, follow: false },
};

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

  return <ProductAccess userName={session.user.name} />;
}
