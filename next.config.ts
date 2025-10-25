import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
