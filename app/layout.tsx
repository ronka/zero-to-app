import type { Metadata } from "next";
import { Geist_Mono, Heebo } from "next/font/google";

import { BRAND_NAME, SITE_URL } from "@/lib/brand";

import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: `${BRAND_NAME} — תבנית AI-first ל־Web ול־Mobile`,
    template: `%s — ${BRAND_NAME}`,
  },
  description:
    "שתי תבניות AI-first ל־Next.js ול־Expo. מריצים /setup ומקבלים starter מותאם עם locale, דאטה, אנליטיקה ו־Skills שמוכנים להרחבה.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "/",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — תבנית AI-first ל־Web ול־Mobile`,
    description:
      "שתי תבניות AI-first ל־Next.js ול־Expo, עם setup מונחה ותשתיות מוצר שמוכנות להרחבה.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — תבנית AI-first ל־Web ול־Mobile`,
    description:
      "שתי תבניות AI-first ל־Next.js ול־Expo, עם setup מונחה ותשתיות מוצר שמוכנות להרחבה.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
