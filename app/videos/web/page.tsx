import type { Metadata } from "next";

import { VideoGuidePage } from "../_components/video-guide-page";
import {
  githubTemplateVideo,
  installToolsVideo,
  serviceAccountsLinks,
  workingWithAgentVideo,
} from "../_lib/shared-videos";
import type { TutorialVideo } from "../_lib/videos";

export const metadata: Metadata = {
  title: "מדריכי Web",
  description: "מדריכי וידאו לעבודה עם תבנית ה־Web של Zero to App.",
};

const videos = [
  installToolsVideo,
  githubTemplateVideo,
  {
    id: "web-setup",
    title: "מריצים את פקודת setup ומחברים שירותים",
    description: `
מריצים את \`/setup\` והופכים את התבנית למוצר שלכם.

בסרטון:

- שם המוצר, תיאור, שפה, כיוון וצבעים
- מה זה Neon, PostHog ו־Resend, ולמה צריך כל אחד מהם
- פתיחת חשבונות וחיבור ה־MCP שלהם לסוכן
- איך \`SETUP.md\` שומר את ההתקדמות אם עוצרים באמצע

**בסוף הסרטון:** האתר רץ מקומית עם שם המוצר והצבעים שלכם.
    `,
    links: serviceAccountsLinks,
  },
  workingWithAgentVideo,
  {
    id: "web-payments",
    title: "מוסיפים תשלום עם Grow ומסתירים את המוצר",
    description: `
**לפני שמתחילים:** חשבון עסקי ב־Grow ולינק תשלום (payment link) למוצר.

בסרטון:

- יצירת לינק תשלום ב־Grow
- הפעלת הסקיל \`grow-business-payments\` עם הלינק
- הסתרת המוצר כך שרק מי ששילם מקבל גישה
- בדיקת רכישה מקצה לקצה

**בסוף הסרטון:** יש עמוד תשלום, ורק מי ששילם נכנס למוצר.
    `,
    links: [{ label: "Grow — פתיחת חשבון עסקי", href: "https://grow.business/" }],
  },
  {
    id: "web-domain-dns",
    title: "מחברים דומיין ל־Vercel ומאמתים אותו ב־Resend",
    description: `
**למה זה חשוב:** בלי דומיין מאומת, Resend שולח מיילים רק לכתובת שלכם, ומשתמשים אמיתיים לא יקבלו אותם.

בסרטון:

- קניית דומיין
- חיבור הדומיין לפרויקט ב־Vercel
- הוספת רשומות ה־DNS ש־Resend מבקש
- בדיקה שהדומיין אומת ושהמיילים מגיעים

**בסוף הסרטון:** האתר נפתח בדומיין שלכם והמיילים יוצאים ממנו.
    `,
    links: [
      {
        label: "Vercel — הוספת דומיין",
        href: "https://vercel.com/docs/domains/working-with-domains/add-a-domain",
      },
      {
        label: "Resend — אימות דומיין",
        href: "https://resend.com/docs/dashboard/domains/introduction",
      },
      {
        label: "Resend — הגדרת DNS בדומיין שמנוהל ב־Vercel",
        href: "https://resend.com/docs/knowledge-base/vercel",
      },
    ],
  },
  {
    id: "web-publish",
    title: "מעלים את האתר לאוויר",
    description: `
אומרים לסוכן "publish my website" והסקיל \`web-publish\` מוביל את התהליך.

בסרטון:

- פתיחת חשבון Vercel וחיבור ל־GitHub
- העברת משתני הסביבה (environment variables) ל־Vercel
- בדיקה שהאתר באוויר עובד
- איך \`LAUNCH.md\` שומר את ההתקדמות

**בסוף הסרטון:** האתר שלכם באוויר.
    `,
    links: [
      { label: "פתיחת חשבון Vercel", href: "https://vercel.com/signup" },
      { label: "Vercel MCP", href: "https://vercel.com/docs/agent-resources/vercel-mcp" },
    ],
  },
  {
    id: "web-updates",
    title: "מעדכנים את האתר אחרי ההשקה",
    description: `
בסרטון:

- מוסיפים שינוי ודוחפים אותו ל־GitHub
- Vercel מעלה אותו לאוויר אוטומטית
- בודקים בגרסת Preview לפני שזה מגיע לכולם
- חוזרים לגרסה קודמת אם משהו נשבר

**בסוף הסרטון:** יודעים לשחרר עדכונים בלי לפחד.
    `,
  },
] satisfies readonly TutorialVideo[];

export default function WebVideosPage() {
  return (
    <VideoGuidePage
      eyebrow="// WEB STARTER"
      title="מדריכי Web"
      introduction="מהתקנת הכלים ועד אתר באוויר עם דומיין ותשלומים. כדאי לצפות לפי הסדר."
      storageKey="zero-to-app:videos:web:completed"
      videos={videos}
    />
  );
}
