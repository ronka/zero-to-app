import type { TutorialVideo } from "./videos";

// Videos recorded once and shown in both the Web and Mobile guides.

export const installToolsVideo = {
  id: "install-tools",
  title: "מתקינים את כלי העבודה",
  description: `
לפני שמתחילים לבנות, מכינים את המחשב.

בסרטון:

- מה זה טרמינל ואיך פותחים אותו
- התקנת Node.js ו־Git
- התקנת עורך קוד
- התקנת Claude Code או Codex והתחברות

**בסוף הסרטון:** הפקודות \`node -v\` ו־\`git --version\` עובדות בטרמינל.
  `,
  links: [
    { label: "הורדת Node.js (גרסת LTS)", href: "https://nodejs.org/en/download" },
    { label: "הורדת Git", href: "https://git-scm.com/downloads" },
    { label: "Visual Studio Code", href: "https://code.visualstudio.com/" },
    { label: "Cursor", href: "https://cursor.com/" },
    { label: "Claude Code — מדריך התקנה", href: "https://code.claude.com/docs/en/overview" },
    { label: "Codex CLI — מדריך התקנה", href: "https://developers.openai.com/codex/cli" },
  ],
} satisfies TutorialVideo;

export const githubTemplateVideo = {
  id: "github-template",
  title: "פותחים חשבון GitHub ומשכפלים את התבנית",
  description: `
בסרטון:

- פתיחת חשבון GitHub
- קבלת גישה לתבנית מעמוד הגישה שלכם
- יצירת repo חדש משלכם מהתבנית
- הורדת הפרויקט למחשב והרצת \`npm install\`

**בסוף הסרטון:** הפרויקט פתוח בעורך הקוד שלכם.
  `,
  links: [
    { label: "עמוד הגישה לתבניות", href: "/access" },
    { label: "פתיחת חשבון GitHub", href: "https://github.com/signup" },
    {
      label: "מדריך: יצירת חשבון GitHub",
      href: "https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github",
    },
    { label: "GitHub Desktop (למי שמעדיף בלי טרמינל)", href: "https://desktop.github.com/" },
  ],
} satisfies TutorialVideo;

export const serviceAccountsLinks = [
  { label: "פתיחת חשבון Neon (מסד נתונים)", href: "https://console.neon.tech/signup" },
  { label: "Neon MCP", href: "https://neon.com/docs/ai/neon-mcp-server" },
  { label: "פתיחת חשבון PostHog (אנליטיקס)", href: "https://us.posthog.com/signup" },
  { label: "PostHog MCP", href: "https://posthog.com/docs/model-context-protocol" },
  { label: "פתיחת חשבון Resend (מיילים)", href: "https://resend.com/signup" },
  { label: "Resend MCP", href: "https://resend.com/docs/mcp-server" },
] as const;

export const workingWithAgentVideo = {
  id: "working-with-agent",
  title: "עובדים עם הסוכן ומוסיפים פיצ'ר ראשון",
  description: `
הסרטון שכדאי לחזור אליו. בונים יחד פיצ'ר ראשון ולומדים את הרגלי העבודה עם הסוכן.

בסרטון:

- איך לתאר לסוכן מה רוצים לבנות
- לבקש תוכנית לפני שהוא כותב קוד
- לבדוק את התוצאה בעצמכם
- לשמור נקודות ביניים עם commit
- מה עושים כשמשהו נשבר ואיך חוזרים אחורה

**בסוף הסרטון:** יש לכם פיצ'ר ראשון שעובד ושמור ב־Git.
  `,
  links: [
    { label: "Claude Code — עבודה יומיומית", href: "https://code.claude.com/docs/en/overview" },
    { label: "Codex CLI", href: "https://developers.openai.com/codex/cli" },
  ],
} satisfies TutorialVideo;
