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
  title: "מדריכי Mobile",
  description: "מדריכי וידאו לעבודה עם תבנית ה־Mobile של Zero to App.",
};

const videos = [
  installToolsVideo,
  githubTemplateVideo,
  {
    id: "mobile-setup",
    title: "מריצים את פקודת setup ומחברים שירותים",
    description: `
מריצים את \`/setup\` והופכים את התבנית לאפליקציה שלכם.

בסרטון:

- שם האפליקציה, תיאור, שפה, כיוון וצבעים
- מה זה Neon, PostHog ו־Resend, ומתי האפליקציה צריכה אותם
- פתיחת חשבונות וחיבור ה־MCP שלהם לסוכן
- איך \`SETUP.md\` שומר את ההתקדמות אם עוצרים באמצע

**בסוף הסרטון:** הפרויקט מותאם לאפליקציה שלכם.
    `,
    links: serviceAccountsLinks,
  },
  {
    id: "mobile-expo-run",
    title: "מכירים את Expo ומריצים על הטלפון",
    description: `
בסרטון:

- מה זה Expo ו־EAS, ולמה משתמשים בהם
- פתיחת חשבון Expo
- הרצה בסימולטור ועל הטלפון
- ההבדל בין Expo Go ל־development build, ולמה רכישות לא עובדות ב־Expo Go

**בסוף הסרטון:** האפליקציה רצה על הטלפון שלכם.
    `,
    links: [
      { label: "פתיחת חשבון Expo", href: "https://expo.dev/signup" },
      { label: "Expo Go", href: "https://expo.dev/go" },
      {
        label: "מה זה development build",
        href: "https://docs.expo.dev/develop/development-builds/introduction/",
      },
      { label: "מה זה EAS", href: "https://docs.expo.dev/eas/" },
      { label: "Expo MCP", href: "https://docs.expo.dev/mcp/" },
    ],
  },
  workingWithAgentVideo,
  {
    id: "mobile-developer-accounts",
    title: "פותחים חשבונות מפתח ב־Apple וב־Google",
    description: `
**כדאי להתחיל מוקדם:** אישור החשבונות יכול לקחת כמה ימים, ובלעדיהם אי אפשר להגדיר רכישות או לפרסם.

בסרטון:

- הרשמה ל־Apple Developer Program
- חתימה על הסכם Paid Apps ב־App Store Connect (חובה לרכישות)
- פתיחת חשבון Google Play Console
- דרישת הבדיקה הסגורה בחשבון Google אישי חדש: 12 בודקים במשך 14 יום

**בסוף הסרטון:** יש לכם חשבונות מפתח פעילים בשתי החנויות.
    `,
    links: [
      { label: "הרשמה ל־Apple Developer Program", href: "https://developer.apple.com/programs/enroll/" },
      { label: "App Store Connect", href: "https://appstoreconnect.apple.com/" },
      {
        label: "Apple — חתימה על הסכמים",
        href: "https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements",
      },
      { label: "פתיחת חשבון Google Play Console", href: "https://play.google.com/console/signup" },
      {
        label: "Google Play — דרישות בדיקה לחשבון אישי חדש",
        href: "https://support.google.com/googleplay/android-developer/answer/14151465",
      },
    ],
  },
  {
    id: "mobile-payments",
    title: "מוסיפים רכישות עם RevenueCat ומסתירים את המוצר",
    description: `
**לפני שמתחילים:** חשבונות מפתח פעילים והסכם Paid Apps חתום (הסרטון הקודם).

בסרטון:

- מה זה RevenueCat ולמה משתמשים בו
- יצירת מוצרים ב־App Store Connect וב־Google Play Console
- הפעלת הסקיל \`add-app-iap\` ובחירת סוג רכישה: מנוי, רכישה חד־פעמית או קרדיטים
- מסך תשלום והסתרת התוכן מאחוריו
- בדיקת רכישה ושחזור רכישות

**בסוף הסרטון:** רק מי ששילם מקבל גישה למוצר.
    `,
    links: [
      { label: "פתיחת חשבון RevenueCat", href: "https://app.revenuecat.com/signup" },
      {
        label: "RevenueCat — התקנה ב־Expo",
        href: "https://www.revenuecat.com/docs/getting-started/installation/expo",
      },
      { label: "RevenueCat MCP", href: "https://www.revenuecat.com/docs/tools/mcp" },
    ],
  },
  {
    id: "mobile-publish-ios",
    title: "מפרסמים ב־App Store",
    description: `
אומרים לסוכן "publish my app" והסקיל \`expo-publish\` מוביל את התהליך.

בסרטון:

- בניית גרסת Production ל־iOS
- שליחה ל־TestFlight ובדיקה
- צילומי מסך, תיאור ומדיניות פרטיות
- שליחה לבדיקה של Apple ומה עושים אם האפליקציה נדחית

**בסוף הסרטון:** האפליקציה נשלחה לבדיקה ב־App Store.
    `,
    links: [
      { label: "Expo — שליחה ל־App Store", href: "https://docs.expo.dev/submit/ios/" },
      { label: "App Store Connect", href: "https://appstoreconnect.apple.com/" },
    ],
  },
  {
    id: "mobile-publish-android",
    title: "מפרסמים ב־Google Play",
    description: `
בסרטון:

- בניית גרסת Production ל־Android
- העלאה לבדיקה סגורה והוספת בודקים
- דף החנות: צילומי מסך, תיאור ומדיניות פרטיות
- מעבר ל־Production אחרי תקופת הבדיקה

**בסוף הסרטון:** האפליקציה בדרך ל־Google Play.
    `,
    links: [
      { label: "Expo — שליחה ל־Google Play", href: "https://docs.expo.dev/submit/android/" },
      { label: "Google Play Console", href: "https://play.google.com/console/signup" },
    ],
  },
  {
    id: "mobile-updates",
    title: "מעדכנים את האפליקציה אחרי ההשקה",
    description: `
בסרטון:

- עדכון OTA עם \`npm run update\`, בלי לעבור שוב בדיקה בחנות
- מתי חייבים גרסה חדשה בחנות, ואיך עושים את זה עם \`npm run release:prepare\`
- איך בודקים איזו גרסה מותקנת דרך שורת הגרסה במסך ההגדרות

**בסוף הסרטון:** יודעים מתי מספיק עדכון OTA ומתי צריך גרסה חדשה בחנות.
    `,
    links: [
      { label: "מה זה EAS Update", href: "https://docs.expo.dev/eas-update/introduction/" },
    ],
  },
] satisfies readonly TutorialVideo[];

export default function MobileVideosPage() {
  return (
    <VideoGuidePage
      eyebrow="// MOBILE STARTER"
      title="מדריכי Mobile"
      introduction="מהתקנת הכלים ועד אפליקציה ב־App Store וב־Google Play. כדאי לצפות לפי הסדר."
      storageKey="zero-to-app:videos:mobile:completed"
      videos={videos}
    />
  );
}
