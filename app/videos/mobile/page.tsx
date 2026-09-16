import type { Metadata } from "next";

import { VideoGuidePage } from "../_components/video-guide-page";
import type { TutorialVideo } from "../_lib/videos";

export const metadata: Metadata = {
  title: "מדריכי Mobile",
  description: "מדריכי וידאו לעבודה עם תבנית ה־Mobile של Zero to App.",
};

const videos = [
  {
    title: "מתחילים עם תבנית ה־Mobile",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

במדריך נלמד איך:

- ליצור repo חדש מהתבנית
- להריץ את \`$setup\`
- להפעיל את האפליקציה ב־iOS או Android
    `,
    videoUrl: "https://youtu.be/M7lc1UVf-VE?placeholder=mobile-start",
  },
  {
    title: "מריצים setup ומתאימים את האפליקציה",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נגדיר שם, שפה, מזהי iOS ו־Android וצבעי מותג, ואז נפעיל את האפליקציה בסימולטור.
    `,
    videoUrl: "https://youtu.be/M7lc1UVf-VE?placeholder=mobile-setup",
  },
  {
    title: "RTL, ניווט וה־Debug Menu",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נכיר את מבנה הניווט, נבדוק פריסת RTL ונפתח את תפריט הדיבאג דרך שורת הגרסה.
    `,
    videoUrl: "https://youtu.be/M7lc1UVf-VE?placeholder=mobile-foundations",
  },
  {
    title: "מוסיפים רכישות עם RevenueCat",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נראה איך להתחיל את תהליך ה־IAP, לבחור מודל רכישה ולבדוק שחזור רכישות בצורה בטוחה.
    `,
    videoUrl: "https://youtu.be/M7lc1UVf-VE?placeholder=mobile-iap",
  },
  {
    title: "מפרסמים עדכון וגרסת Production",
    description: `
זהו סרטון זמני עד להעלאת המדריך המלא.

נעבור על EAS Update, בניית גרסאות iOS ו־Android וניהול מספרי הגרסה המובנה בתבנית.
    `,
    videoUrl: "https://youtu.be/M7lc1UVf-VE?placeholder=mobile-publish",
  },
] satisfies readonly TutorialVideo[];

export default function MobileVideosPage() {
  return (
    <VideoGuidePage
      eyebrow="// MOBILE STARTER"
      title="מדריכי Mobile"
      introduction="כל מה שצריך כדי להתאים את תבנית ה־Expo, להפעיל אותה ולהמשיך עד לפרסום."
      storageKey="zero-to-saas:videos:mobile:completed"
      videos={videos}
    />
  );
}
