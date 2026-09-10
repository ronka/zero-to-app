import type { Metadata } from "next";
import { Geist_Mono, Heebo } from "next/font/google";
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
  title: "Zero to SaaS — משיקים מוצר בימים, לא בשבועות",
  description:
    "תבנית starter ישראלית ל־Next.js ול־Expo, עם RTL, אימות, דאטה, תשלומים, מיילים, אנליטיקה ו־Skills מוכנים לסוכן הקוד שלכם.",
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
