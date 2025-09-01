import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow all HTTPS hosts
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // You can also allow all HTTP if needed
    // but usually HTTPS is enough
    /*
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    */
  },
};

export default nextConfig;
