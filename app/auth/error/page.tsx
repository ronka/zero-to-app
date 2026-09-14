import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <section className="w-full max-w-lg rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
        <h1 className="text-4xl font-black">הקישור לא תקף</h1>
        <p className="mt-4 leading-7 text-zinc-400">ייתכן שהקישור פג או שכבר השתמשתם בו. בקשו קישור חדש וננסה שוב.</p>
        <Link className="mt-8 inline-flex min-h-14 items-center rounded-full bg-[var(--lime)] px-7 font-black text-[var(--ink)]" href="/login">
          בקשת קישור חדש
        </Link>
      </section>
    </main>
  );
}
