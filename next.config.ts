import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["oracledb", "pg", "ssh2"],

};

export default nextConfig;
