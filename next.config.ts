import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.nismara.my.id',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
