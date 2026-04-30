import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔥 FIX: increase upload body size limit
  experimental: {
    middlewareClientMaxBodySize: "100mb", // or "100mb"
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
    ],
  },

  turbopack: {},
};

export default nextConfig;
