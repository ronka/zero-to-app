import Link from "next/link";

import { MagicLinkForm } from "@/app/components/magic-link-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <section className="w-full max-w-lg rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-2xl md:p-10">
        <p className="font-mono text-sm font-bold text-[var(--lime)]">{"// BUYER ACCESS"}</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">כניסה לרוכשים</h1>
        <p className="mt-4 leading-7 text-zinc-400">
          הזינו את כתובת האימייל שבה השתמשתם בתשלום. נשלח קישור חד־פעמי ליצירת חשבון או להתחברות.
        </p>
        <MagicLinkForm />
        <Link className="mt-7 inline-block text-sm text-zinc-500 hover:text-white" href="/">
          חזרה לעמוד הראשי
        </Link>
      </section>
    </main>
  );
}
