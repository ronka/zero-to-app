import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.zerotoapp.co.il" }],
        destination: "https://zerotoapp.co.il/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
