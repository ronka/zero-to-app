import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/access", "/api/", "/auth/", "/login", "/thank-you"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL.origin,
  };
}
