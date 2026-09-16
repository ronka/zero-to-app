import type { Metadata } from "next";

import { VideoGuidePage } from "../_components/video-guide-page";
import type { TutorialVideo } from "../_lib/videos";

export const metadata: Metadata = {
  title: "מדריכי Web — Zero to SaaS",
  description: "מדריכי וידאו לעבודה עם תבנית ה־Web של Zero to SaaS.",
};

const videos = [
  {
    title: "מתחילים עם תבנית ה־Web",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

במדריך נלמד איך:

- ליצור repo חדש מהתבנית
- להריץ את \`$setup\`
- להפעיל את האתר מקומית
    `,
    videoUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE&placeholder=web-start",
  },
  {
    title: "מריצים setup ומתאימים את המוצר",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נעבור על בחירת שם המוצר, השפה, הכיוון והצבעים, ונראה איך \`SETUP.md\` שומר את ההתקדמות.
    `,
    videoUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE&placeholder=web-setup",
  },
  {
    title: "מחברים Database, Analytics ו־Email",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נראה מתי כדאי לחבר את Neon, PostHog ו־Resend ואיך הסוכן משתמש בחיבורים בפרויקט.
    `,
    videoUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE&placeholder=web-integrations",
  },
  {
    title: "מוסיפים תשלומים עם Grow",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נפעיל את Skill התשלומים, נגדיר מוצר ונבין את תהליך הרכישה וההרשאות מקצה לקצה.
    `,
    videoUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE&placeholder=web-payments",
  },
] satisfies readonly TutorialVideo[];

export default function WebVideosPage() {
  return (
    <VideoGuidePage
      eyebrow="// WEB STARTER"
      title="מדריכי Web"
      introduction="כל מה שצריך כדי להפוך את תבנית ה־Next.js למוצר שלכם ולהתחיל לבנות."
      storageKey="zero-to-saas:videos:web:completed"
      videos={videos}
    />
  );
}
