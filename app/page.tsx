import Image from "next/image";

const integrations = [
  { name: "better-auth", label: "אימות משתמשים", color: "#c7ff4a" },
  { name: "Neon", label: "Postgres בענן", color: "#6dd8ff" },
  { name: "PostHog", label: "אירועים ואנליטיקה", color: "#ffcf4a" },
  { name: "grow / Freemius", label: "תשלומים בישראל ובעולם", color: "#ff684d" },
  { name: "Resend", label: "מיילים שבאמת מגיעים", color: "#b9a5ff" },
  { name: "Tailwind", label: "UI מהיר ורספונסיבי", color: "#59d5f7" },
];

const steps = [
  ["01", "בוחרים בסיס", "אפליקציית Expo או אתר Next.js — לפי המוצר שאתם בונים."],
  ["02", "משכפלים", "מקבלים repo מסודר, עם ארכיטקטורה והגדרות שכבר עובדות יחד."],
  ["03", "מגדירים", "מחברים מפתחות API, צבעים, דומיין ושם. בלי שבוע של plumbing."],
  ["04", "משיקים", "מוסיפים את הפיצ׳ר הייחודי שלכם ועולים לאוויר."],
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Mark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-[var(--lime)] text-[var(--ink)] shadow-[3px_3px_0_#ff684d]" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path d="M6 4h8l-3 6h7L8 21l2-8H5l1-9Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <main dir="rtl" className="overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_180_180%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%22.9%22_numOctaves=%222%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22_opacity=%22.8%22/%3E%3C/svg%3E')]" />

      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <a href="#top" className="flex items-center gap-3 font-mono text-[15px] font-bold tracking-tight text-white" aria-label="Zero to SaaS — דף הבית">
            <Mark />
            <span dir="ltr">ZERO → SAAS</span>
          </a>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-zinc-300 md:flex" aria-label="ניווט ראשי">
            <a className="transition hover:text-[var(--lime)]" href="#included">מה בפנים</a>
            <a className="transition hover:text-[var(--lime)]" href="#how">איך זה עובד</a>
            <a className="transition hover:text-[var(--lime)]" href="#about">מי אני</a>
          </nav>
          <a href="#access" className="rounded-full border border-[var(--line)] bg-white/5 px-5 py-2.5 text-sm font-bold transition hover:border-[var(--lime)] hover:text-[var(--lime)]">
            אני רוצה להשיק
          </a>
        </div>
      </header>

      <section id="top" className="relative min-h-[880px] border-b border-[var(--line)] pt-32 md:min-h-[820px] md:pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(199,255,74,.13),transparent_28%),radial-gradient(circle_at_78%_35%,rgba(109,216,255,.08),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
          <div>
            <div className="mb-8 inline-flex rotate-[-1deg] items-center gap-2 rounded-md bg-[var(--paper)] px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-[5px_5px_0_var(--coral)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#149646]" />
              ה־starter הראשון שבנוי באמת ל־RTL
            </div>
            <h1 className="max-w-4xl text-[clamp(3.7rem,8vw,7.6rem)] font-black leading-[.84] tracking-[-0.065em]">
              מרעיון למוצר
              <span className="mt-4 block text-[var(--lime)]">בימים. לא בשבועות.</span>
            </h1>
            <p className="mt-9 max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl md:leading-9">
              כל מה שצריך כדי להרים מוצר ישראלי אמיתי — Web או Mobile — כבר מחובר, מוגדר ומדבר עברית. אתם מביאים את הרעיון. התבנית דואגת לכל השאר.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href="#access" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[var(--lime)] px-7 text-base font-black text-[var(--ink)] shadow-[0_0_35px_rgba(199,255,74,.2)] transition hover:-translate-y-1 hover:shadow-[0_8px_0_#617d1e]">
                קחו אותי לקוד
                <span className="transition group-hover:translate-x-1" dir="ltr"><ArrowIcon /></span>
              </a>
              <a href="#included" className="inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-7 font-bold transition hover:border-zinc-500">
                תראו מה כבר בפנים
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400">
              <span className="flex items-center gap-2 text-[var(--lime)]"><CheckIcon /><b className="text-zinc-300">Next.js + Expo</b></span>
              <span className="flex items-center gap-2 text-[var(--lime)]"><CheckIcon /><b className="text-zinc-300">RTL מהשורש</b></span>
              <span className="flex items-center gap-2 text-[var(--lime)]"><CheckIcon /><b className="text-zinc-300">Skills לסוכן AI</b></span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ms-auto">
            <div className="absolute -left-6 -top-8 z-10 rotate-[-7deg] rounded-full bg-[var(--coral)] px-5 py-3 font-mono text-sm font-black text-white shadow-xl">SHIP IT 🇮🇱</div>
            <div className="overflow-hidden rounded-[28px] border border-zinc-700 bg-[#101210] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-[#181a18] px-5 py-4" dir="ltr">
                <div className="flex gap-2"><span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" /></div>
                <span className="font-mono text-xs text-zinc-500">zero-to-saas / launch</span>
              </div>
              <div className="space-y-5 p-5 font-mono text-sm md:p-8" dir="ltr">
                <p className="text-zinc-500">$ npx create-zero-saas my-app</p>
                <div className="rounded-xl border border-zinc-800 bg-black/30 p-5">
                  <p className="mb-4 text-zinc-400">Choose your launchpad:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[var(--lime)] bg-[rgba(199,255,74,.07)] p-4 text-[var(--lime)]"><b>▲ Next.js</b><small className="mt-1 block text-zinc-500">web app</small></div>
                    <div className="rounded-lg border border-zinc-700 p-4 text-white"><b>◉ Expo</b><small className="mt-1 block text-zinc-500">mobile app</small></div>
                  </div>
                </div>
                <div className="space-y-3 text-zinc-300">
                  <p><span className="text-[var(--lime)]">✓</span> better-auth configured</p>
                  <p><span className="text-[var(--lime)]">✓</span> neon database connected</p>
                  <p><span className="text-[var(--lime)]">✓</span> payments + events ready</p>
                  <p><span className="text-[var(--lime)]">✓</span> rtl layout enabled</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--lime)] p-4 font-bold text-[var(--ink)]">
                  <span className="text-lg">⚡</span>
                  Ready to build the part that matters.
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 right-5 rotate-3 rounded-lg border border-zinc-700 bg-[var(--surface-strong)] px-5 py-3 font-mono text-xs text-[var(--sky)] shadow-xl">deploy.status = &quot;live&quot;</div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--lime)] py-4 text-[var(--ink)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 font-mono text-xs font-black uppercase tracking-[.14em] md:text-sm" dir="ltr">
          <span>AUTH ✓</span><span>DATABASE ✓</span><span>PAYMENTS ✓</span><span>EMAIL ✓</span><span>ANALYTICS ✓</span><span>RTL ✓</span>
        </div>
      </section>

      <section id="included" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
          <div>
            <p className="font-mono text-sm font-bold text-[var(--coral)]">{"// PICK YOUR STACK"}</p>
            <h2 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.05em] md:text-7xl">בסיס אחד.<br />שתי דרכים להשיק.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-zinc-400 lg:ms-auto">אותה חשיבה, אותם חיבורים, אותו RTL מדויק. רק בוחרים איפה המוצר שלכם חי ומתחילים מהחלק המעניין.</p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-7 transition hover:border-[var(--lime)] md:p-10">
            <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[var(--lime)] opacity-[.07] blur-2xl transition group-hover:opacity-15" />
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs font-bold text-[var(--lime)]">01 / WEB</span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-400">Next.js</span>
            </div>
            <h3 className="mt-20 text-4xl font-black tracking-tight md:text-5xl">אתר SaaS שמוכן למכור</h3>
            <p className="mt-5 max-w-md text-lg leading-8 text-zinc-400">דפי מוצר, משתמשים, דאטה, מיילים, אנליטיקה ותשלום — מחוברים במבנה שקל להבין ולהרחיב.</p>
            <div className="mt-9 flex flex-wrap gap-2 text-sm font-bold"><span className="rounded-full bg-white/5 px-3 py-2">App Router</span><span className="rounded-full bg-white/5 px-3 py-2">Server Actions</span><span className="rounded-full bg-white/5 px-3 py-2">SEO</span></div>
          </article>
          <article className="group relative overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-7 transition hover:border-[var(--sky)] md:p-10">
            <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[var(--sky)] opacity-[.07] blur-2xl transition group-hover:opacity-15" />
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs font-bold text-[var(--sky)]">02 / MOBILE</span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-400">Expo</span>
            </div>
            <h3 className="mt-20 text-4xl font-black tracking-tight md:text-5xl">אפליקציה שנכנסת לכיס</h3>
            <p className="mt-5 max-w-md text-lg leading-8 text-zinc-400">בסיס יציב ל־iOS ולאנדרואיד, עם ניווט, משתמשים, דאטה ועיצוב שמרגיש טבעי בעברית מהמסך הראשון.</p>
            <div className="mt-9 flex flex-wrap gap-2 text-sm font-bold"><span className="rounded-full bg-white/5 px-3 py-2">iOS</span><span className="rounded-full bg-white/5 px-3 py-2">Android</span><span className="rounded-full bg-white/5 px-3 py-2">EAS</span></div>
          </article>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--paper)] py-24 text-[var(--ink)] md:py-32">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-sm font-black text-[#d84531]">{"// THE BORING STUFF, DONE"}</p>
            <h2 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.05em] md:text-7xl">כל החיבורים.<br />בלי כל הכאב.</h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-black/15 bg-black/15 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((item, index) => (
              <article key={item.name} className="group relative min-h-56 bg-[var(--paper)] p-7 transition hover:bg-white md:p-9">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl font-mono text-lg font-black" style={{ backgroundColor: item.color }}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-xs text-black/35">CONNECTED</span>
                </div>
                <h3 className="mt-9 text-2xl font-black" dir="ltr">{item.name}</h3>
                <p className="mt-2 text-base font-medium text-black/55">{item.label}</p>
                <div className="absolute inset-x-8 bottom-0 h-1 origin-right scale-x-0 transition duration-300 group-hover:scale-x-100" style={{ backgroundColor: item.color }} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute -right-36 top-0 h-96 w-96 rounded-full bg-[var(--coral)] opacity-[.08] blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 md:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-sm font-bold text-[var(--coral)]">{"// AI-NATIVE WORKFLOW"}</p>
            <h2 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.05em] md:text-7xl">לא רק קוד.<br />גם דרך לעבוד.</h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">התבנית מגיעה עם Skills מותאמים לסוכן הקוד שלכם. הם מכירים את הארכיטקטורה, את החיבורים ואת כללי המשחק — ועוזרים להוסיף פיצ׳רים ולפרוס בלי לפרק דברים בדרך.</p>
            <ul className="mt-9 grid gap-4 text-base font-bold sm:grid-cols-2">
              <li className="flex items-center gap-3 text-[var(--lime)]"><CheckIcon /><span className="text-zinc-200">הוספת פיצ׳ר חדש</span></li>
              <li className="flex items-center gap-3 text-[var(--lime)]"><CheckIcon /><span className="text-zinc-200">חיבור שירות נוסף</span></li>
              <li className="flex items-center gap-3 text-[var(--lime)]"><CheckIcon /><span className="text-zinc-200">Deployment בטוח</span></li>
              <li className="flex items-center gap-3 text-[var(--lime)]"><CheckIcon /><span className="text-zinc-200">שמירה על הקונבנציות</span></li>
            </ul>
          </div>
          <div className="rounded-[28px] border border-zinc-700 bg-[var(--surface)] p-4 shadow-2xl">
            <div className="rounded-[20px] bg-[#0d0f0e] p-6 font-mono text-sm md:p-8" dir="ltr">
              <p className="text-zinc-600"># /skills/add-paid-feature.md</p>
              <p className="mt-6 text-zinc-300"><span className="text-[var(--coral)]">user:</span> Add a premium workspace</p>
              <div className="my-6 border-l-2 border-[var(--lime)] pl-5 text-zinc-400">
                <p className="text-[var(--lime)]">agent:</p>
                <p className="mt-2">I know this codebase.</p>
                <p>Adding the data model, access rule,</p>
                <p>payment event and UI state...</p>
              </div>
              <div className="space-y-2 text-zinc-300">
                <p><span className="text-[var(--lime)]">✓</span> schema updated</p>
                <p><span className="text-[var(--lime)]">✓</span> entitlement checked</p>
                <p><span className="text-[var(--lime)]">✓</span> events tracked</p>
                <p><span className="text-[var(--lime)]">✓</span> deployment verified</p>
              </div>
              <p className="mt-7 animate-pulse text-[var(--lime)]">█ feature ready</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-[var(--line)] bg-[var(--surface)] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="font-mono text-sm font-bold text-[var(--sky)]">{"// ZERO TO SHIPPED"}</p><h2 className="mt-5 text-5xl font-black tracking-[-.05em] md:text-7xl">המסלול הקצר לאוויר</h2></div>
            <p className="max-w-md text-lg text-zinc-400">ארבעה צעדים. בלי מסע כומתה דרך תיעוד של שישה ספקים.</p>
          </div>
          <ol className="relative mt-16 grid gap-5 lg:grid-cols-4">
            <div className="absolute right-[10%] left-[10%] top-8 hidden border-t border-dashed border-zinc-600 lg:block" aria-hidden="true" />
            {steps.map(([number, title, text]) => (
              <li key={number} className="relative rounded-[24px] border border-[var(--line)] bg-[var(--background)] p-6">
                <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-600 bg-[var(--background)] font-mono text-lg font-black text-[var(--lime)]">{number}</span>
                <h3 className="mt-8 text-2xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-zinc-400">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] lg:grid-cols-[.86fr_1.14fr]">
          <div className="relative min-h-[390px] overflow-hidden bg-[#b9a5ff] p-8 md:min-h-[560px]">
            <div className="absolute right-7 top-7 z-10 rotate-2 rounded-md bg-[var(--lime)] px-4 py-2 font-mono text-sm font-black shadow-[4px_4px_0_var(--ink)]">HI, I&apos;M RON.</div>
            <Image src="/ron-kantor.png" alt="רון קנטור" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain object-bottom pt-14" />
          </div>
          <div className="flex flex-col justify-center p-7 md:p-14 lg:p-16">
            <p className="font-mono text-sm font-black text-[#d84531]">{"// BUILT FROM EXPERIENCE"}</p>
            <h2 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.05em] md:text-7xl">היי, אני<br />רון קנטור.</h2>
            <p className="mt-8 text-lg leading-8 text-black/65">אני מפתח תוכנה בגוגל, עם 10 שנות ניסיון בסטארטאפים, חברות קטנות ומוצרים אמיתיים. כתבתי את ״המדריך להייטקיסט המתחיל״ ואני כותב על פיתוח, קריירה וטכנולוגיה ב־ronka.dev.</p>
            <p className="mt-5 text-lg leading-8 text-black/65">בניתי את התבנית הזו מהדברים שחזרתי עליהם שוב ושוב בכל מוצר: הדברים שחייבים לעבוד, אבל לא צריכים לקחת לכם שבועות.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="https://www.ronka.dev" target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white">הבלוג שלי ↗</a>
              <a href="https://hightechguide.co.il" target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white">המדריך להייטקיסט ↗</a>
              <a href="https://www.linkedin.com/in/ron-kantor" target="_blank" rel="noreferrer" className="rounded-full border border-black/20 px-5 py-3 text-sm font-black transition hover:bg-black hover:text-white">LinkedIn ↗</a>
            </div>
          </div>
        </div>
      </section>

      <section id="access" className="relative border-t border-[var(--line)] py-24 md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(199,255,74,.12),transparent_42%)]" />
        <div className="relative mx-auto max-w-5xl px-5 text-center md:px-8">
          <p className="font-mono text-sm font-bold text-[var(--lime)]">{"// READY WHEN YOU ARE"}</p>
          <h2 className="mt-6 text-[clamp(3.5rem,9vw,8rem)] font-black leading-[.83] tracking-[-.065em]">תפסיקו להכין.<br /><span className="text-[var(--lime)]">תתחילו להשיק.</span></h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-zinc-400">התבנית נמצאת בהכנה. רוצים לדעת ראשונים כשהגישה נפתחת?</p>
          <a href="https://www.linkedin.com/in/ron-kantor" target="_blank" rel="noreferrer" className="group mt-10 inline-flex min-h-16 items-center justify-center gap-3 rounded-full bg-[var(--lime)] px-9 text-lg font-black text-[var(--ink)] transition hover:-translate-y-1 hover:shadow-[0_8px_0_#617d1e]">
            עקבו אחרי העדכונים
            <span className="transition group-hover:translate-x-1" dir="ltr"><ArrowIcon /></span>
          </a>
          <p className="mt-5 text-sm text-zinc-600">בלי טופס. בלי ספאם. רק עדכוני השקה.</p>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-sm text-zinc-500 md:flex-row md:px-8">
          <div className="flex items-center gap-3 text-white"><Mark /><span className="font-mono font-bold" dir="ltr">ZERO → SAAS</span></div>
          <p>נבנה בישראל, בשביל מי שמעדיף מוצר עובד על עוד שבוע של setup.</p>
          <p dir="ltr">© {new Date().getFullYear()} Ron Kantor</p>
        </div>
      </footer>
    </main>
  );
}
