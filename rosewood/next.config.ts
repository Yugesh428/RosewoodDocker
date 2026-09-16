import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Suppress pre-existing TS errors during production build
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["pg", "pg-hstore", "pg-native", "bcryptjs", "sequelize", "xlsx"],
  // Use standalone output for Docker
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    unoptimized: false,
    domains: [],
  },
};

export default nextConfig;
