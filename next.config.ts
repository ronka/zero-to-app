import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ["www.zerotoapp.co.il", "zero-to-app-ten.vercel.app"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://zerotoapp.co.il/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
