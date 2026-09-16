import Link from "next/link";

import { ACCESS_REPOSITORIES } from "@/lib/access/repositories";
import { BRAND_WORDMARK, SUPPORT_EMAIL } from "@/lib/brand";

import { CopyButton } from "./copy-button";
import { GitHubAccessCard, type RepositoryAccessView } from "./github-access-card";

// Rendered by app/access/page.tsx only after the session and entitlement checks pass.

const steps = [
  {
    number: "01",
    title: "מאשרים את ההזמנה ב־GitHub",
    text: "ה־repos פרטיים. אחרי הרכישה נשלחת הזמנה ל־GitHub — מאשרים אותה כדי לקבל גישה לשתי התבניות.",
  },
  {
    number: "02",
    title: "יוצרים repo משלכם",
    text: "לוחצים על ״Use this template״ כדי לפתוח repo חדש בחשבון שלכם, או משכפלים ישירות עם git.",
  },
  {
    number: "03",
    title: "מתקינים ופותחים בסוכן",
    text: "מריצים npm install ופותחים את התיקייה ב־Claude Code או ב־Codex.",
  },
  {
    number: "04",
    title: "מריצים setup",
    text: "ה־Skill שואל על המוצר, השפה והכיוון, מחבר Neon ו־PostHog ורושם התקדמות ב־SETUP.md.",
  },
];

function Mark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-[var(--lime)] text-[var(--ink)] shadow-[3px_3px_0_#ff684d]" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path d="M6 4h8l-3 6h7L8 21l2-8H5l1-9Z" fill="currentColor" />
      </svg>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommandLine({ command, label }: { command: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 font-mono text-[13px]" dir="ltr">
      <code className="min-w-0 overflow-x-auto whitespace-nowrap text-zinc-200">
        <span className="select-none text-[var(--lime)]">$ </span>
        {command}
      </code>
      <CopyButton value={command} label={label} />
    </div>
  );
}

type GitHubAccessProps = {
  configured: boolean;
  linked: boolean;
  login: string | null;
  repositories: RepositoryAccessView[];
  shouldProvision: boolean;
  connectionError: boolean;
};

export function ProductAccess({ userName, githubAccess }: { userName: string; githubAccess: GitHubAccessProps }) {
  return (
    <main dir="rtl" className="flex-1 overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="flex items-center gap-3 font-mono text-[15px] font-bold tracking-tight text-white" aria-label="Zero to App — דף הבית">
            <Mark />
            <span dir="ltr">{BRAND_WORDMARK}</span>
          </Link>
          <span className="rounded-full border border-[var(--lime)]/40 bg-[rgba(199,255,74,.07)] px-4 py-2 text-sm font-bold text-[var(--lime)]">
            רכישה פעילה ✓
          </span>
        </div>
      </header>

      <section className="relative border-b border-[var(--line)] pb-20 pt-16 md:pb-24 md:pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(199,255,74,.13),transparent_32%),radial-gradient(circle_at_80%_60%,rgba(109,216,255,.07),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <div className="inline-flex rotate-[-1deg] items-center gap-2 rounded-md bg-[var(--paper)] px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-[5px_5px_0_var(--coral)]">
            <span className="h-2 w-2 rounded-full bg-[#149646]" />
            תודה על הרכישה, {userName}
          </div>
          <h1 className="mt-8 max-w-4xl text-[clamp(3rem,7vw,6.4rem)] font-black leading-[.88] tracking-[-0.06em]">
            הקוד שלכם.
            <span className="block text-[var(--lime)]">בואו נתחיל לבנות.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl md:leading-9">
            יש לכם גישה לשתי התבניות. בוחרים את זו שמתאימה למוצר — או את שתיהן — יוצרים repo משלכם ומריצים{" "}
            <span className="rounded bg-white/10 px-2 py-1 font-mono text-[.9em] text-[var(--lime)]" dir="ltr">/setup</span>.
          </p>
        </div>
      </section>

      <section aria-labelledby="repos-heading" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <p className="font-mono text-sm font-bold text-[var(--coral)]">{"// YOUR REPOSITORIES"}</p>
        <h2 id="repos-heading" className="mt-4 text-4xl font-black tracking-[-.04em] md:text-6xl">שני repos. מוכנים לשכפול.</h2>

        <GitHubAccessCard {...githubAccess} />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {ACCESS_REPOSITORIES.map((repo) => {
            const repoUrl = repo.url;
            const slug = `${repo.owner}/${repo.repo}`;
            const folder = repo.repo;
            const access = githubAccess.repositories.find((item) => item.id === repo.id);
            const active = access?.state === "active";
            return (
              <article
                key={repo.id}
                className="relative flex flex-col overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-9"
                style={{ borderTopColor: repo.accent, borderTopWidth: 3 }}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold" style={{ color: repo.accent }}>{repo.index}</span>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-400">{repo.stack}</span>
                </div>
                <h3 className="mt-10 text-3xl font-black tracking-tight md:text-4xl">{repo.title}</h3>
                <p className="mt-2 font-mono text-sm text-zinc-500" dir="ltr">{slug}</p>
                <p className="mt-5 max-w-md text-base leading-7 text-zinc-400 md:text-lg md:leading-8">{repo.description}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
                  {repo.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 px-3 py-1.5">{tag}</span>
                  ))}
                </div>

                <Link
                  href={`/videos/${repo.id}`}
                  className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 transition hover:border-zinc-500 hover:bg-black/30"
                >
                  <span>
                    <span className="block text-sm font-black text-white">מדריכי וידאו</span>
                    <span className="mt-1 block text-sm text-zinc-500">צופים בהדרכה ומסמנים התקדמות</span>
                  </span>
                  <span className="text-xl" style={{ color: repo.accent }} aria-hidden="true">←</span>
                </Link>

                {active ? (
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={`${repoUrl}/generate`}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-black text-[var(--ink)] transition hover:-translate-y-0.5"
                      style={{ backgroundColor: repo.accent }}
                    >
                      Use this template
                      <span className="transition group-hover:translate-x-1" dir="ltr"><ArrowIcon /></span>
                    </a>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] px-6 text-sm font-bold transition hover:border-zinc-500"
                    >
                      פתיחה ב־GitHub ↗
                    </a>
                  </div>
                ) : (
                  <p className="mt-8 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-zinc-400">
                    חברו GitHub ואשרו את ההזמנה כדי לפתוח את הקישורים.
                  </p>
                )}

                {active ? (
                  <div className="mt-8 space-y-2 border-t border-[var(--line)] pt-6">
                    <p className="text-sm font-bold text-zinc-400">או משכפלים ישירות:</p>
                    <CommandLine command={`git clone ${repoUrl}.git`} label={`העתקת פקודת השכפול של ${repo.title}`} />
                    <CommandLine command={`cd ${folder} && npm install`} label={`העתקת פקודת ההתקנה של ${repo.title}`} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="border-y border-[var(--line)] bg-[var(--surface)] py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="font-mono text-sm font-bold text-[var(--sky)]">{"// FIRST 10 MINUTES"}</p>
          <h2 id="steps-heading" className="mt-4 text-4xl font-black tracking-[-.04em] md:text-6xl">מה עושים עכשיו</h2>
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <li key={step.number} className="rounded-[24px] border border-[var(--line)] bg-[var(--background)] p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-600 font-mono text-base font-black text-[var(--lime)]">{step.number}</span>
                <h3 className="mt-6 text-xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-zinc-400">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[20px] border border-zinc-800 bg-[#0d0f0e] p-6 font-mono text-sm" dir="ltr">
              <p className="text-zinc-600"># Claude Code</p>
              <p className="mt-3 text-zinc-200"><span className="text-[var(--lime)]">›</span> /setup</p>
              <p className="mt-6 text-zinc-600"># Codex</p>
              <p className="mt-3 text-zinc-200"><span className="text-[var(--lime)]">›</span> $setup</p>
            </div>
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--background)] p-6 leading-7 text-zinc-400">
              <p className="font-bold text-zinc-200">אפשר לעצור באמצע.</p>
              <p className="mt-2">
                ההתקדמות נשמרת ב־<span className="font-mono text-[var(--lime)]" dir="ltr">SETUP.md</span>. מריצים שוב{" "}
                <span className="font-mono text-[var(--lime)]" dir="ltr">/setup</span> וממשיכים מהשלב הראשון שלא הושלם. ה־setup עובד בעברית או באנגלית, ושפת המוצר נבחרת בנפרד.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="flex flex-col gap-6 rounded-[28px] bg-[var(--paper)] p-7 text-[var(--ink)] md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="text-2xl font-black md:text-3xl">לא קיבלתם הזמנה ל־GitHub?</h2>
            <p className="mt-2 max-w-xl leading-7 text-black/60">
              בדקו את תיבת המייל המקושרת לחשבון ה־GitHub שלכם, או כתבו לי עם המייל שאיתו רכשתם ושם המשתמש שלכם ב־GitHub.
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Zero to App — GitHub access")}`}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-sm font-black text-white transition hover:bg-black"
          >
            כתבו לי
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-zinc-500 md:flex-row md:px-8">
          <div className="flex items-center gap-3 text-white"><Mark /><span className="font-mono font-bold" dir="ltr">{BRAND_WORDMARK}</span></div>
          <p dir="ltr">© {new Date().getFullYear()} Ron Kantor</p>
        </div>
      </footer>
    </main>
  );
}
