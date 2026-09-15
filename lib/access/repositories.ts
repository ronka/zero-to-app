export type AccessRepository = {
  id: "web" | "mobile";
  index: string;
  stack: string;
  title: string;
  description: string;
  url: string;
  owner: string;
  repo: string;
  accent: string;
  tags: string[];
};

function githubRepository(
  metadata: Omit<AccessRepository, "url" | "owner" | "repo">,
  configuredUrl: string | undefined,
  fallbackUrl: string,
): AccessRepository {
  const url = (configuredUrl ?? fallbackUrl).replace(/\.git$/, "").replace(/\/$/, "");
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(url);
  if (!match) throw new Error(`Invalid GitHub repository URL: ${url}`);

  return { ...metadata, url, owner: match[1], repo: match[2] };
}

export const ACCESS_REPOSITORIES: AccessRepository[] = [
  githubRepository(
    {
      id: "web",
      index: "01 / WEB",
      stack: "Next.js",
      title: "תבנית ה־Web",
      description: "אתר SaaS שמוכן למכור: משתמשים, דאטה, מיילים, אנליטיקה ותשלומים דרך grow.business.",
      accent: "var(--lime)",
      tags: ["App Router", "better-auth", "Neon", "PostHog", "grow.business"],
    },
    process.env.ACCESS_WEB_REPO_URL,
    "https://github.com/hightechguide/starter-web",
  ),
  githubRepository(
    {
      id: "mobile",
      index: "02 / MOBILE",
      stack: "Expo",
      title: "תבנית ה־Mobile",
      description: "אפליקציה ל־iOS ולאנדרואיד עם ניווט, משתמשים, דאטה, מנויים ו־RTL מהמסך הראשון.",
      accent: "var(--sky)",
      tags: ["iOS", "Android", "EAS", "RevenueCat", "RTL"],
    },
    process.env.ACCESS_MOBILE_REPO_URL,
    "https://github.com/hightechguide/starter-mobile",
  ),
];

export function githubOAuthConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function githubAppConfigured() {
  return Boolean(
    process.env.GITHUB_APP_ID &&
      process.env.GITHUB_APP_INSTALLATION_ID &&
      process.env.GITHUB_APP_PRIVATE_KEY,
  );
}
