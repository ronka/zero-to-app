import Link from "next/link";

function Mark() {
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--lime)] font-mono font-black text-[var(--ink)] shadow-[3px_3px_0_var(--coral)]"
      aria-hidden="true"
    >
      0→
    </span>
  );
}

export default function VideosLayout({ children }: LayoutProps<"/videos">) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 font-mono text-[15px] font-bold tracking-tight text-white"
            aria-label="Zero to App — דף הבית"
          >
            <Mark />
            <span dir="ltr">ZERO → APP</span>
          </Link>

          <nav className="flex items-center gap-2" aria-label="מדריכי וידאו">
            <Link
              href="/videos/web"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold transition hover:border-[var(--lime)] hover:text-[var(--lime)]"
            >
              Web
            </Link>
            <Link
              href="/videos/mobile"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold transition hover:border-[var(--sky)] hover:text-[var(--sky)]"
            >
              Mobile
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="mt-auto border-t border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-zinc-500 md:px-8">
          מדריכי Zero to App
        </div>
      </footer>
    </div>
  );
}
