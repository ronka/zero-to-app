"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="shrink-0 rounded-md border border-zinc-700 bg-white/5 px-3 py-1.5 font-sans text-xs font-bold text-zinc-300 transition hover:border-[var(--lime)] hover:text-[var(--lime)]"
    >
      <span aria-live="polite">{copied ? "הועתק ✓" : "העתקה"}</span>
    </button>
  );
}
