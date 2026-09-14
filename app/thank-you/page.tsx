import Link from "next/link";

import { MagicLinkForm } from "@/app/components/magic-link-form";
import { PurchasePending } from "@/app/components/purchase-pending";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <section className="w-full max-w-xl rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-2xl md:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--lime)] text-2xl font-black text-[var(--ink)]">✓</div>
        <h1 className="mt-6 text-4xl font-black tracking-tight">תודה על הרכישה</h1>
        <p className="mt-4 leading-7 text-zinc-300">
          אחרי ש־Grow יאשר את התשלום, נשלח לאימייל של הרכישה קישור מאובטח. הקישור ייצור את החשבון בפעם הראשונה ויכניס אתכם ישירות לתוכן.
        </p>
        <PurchasePending />
        <MagicLinkForm buttonLabel="שלחו שוב קישור גישה" />
        <Link className="mt-7 inline-block text-sm text-zinc-500 hover:text-white" href="/">
          חזרה לעמוד הראשי
        </Link>
      </section>
    </main>
  );
}
