import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: "incremental",
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
    ],
  },
};

export default nextConfig;
