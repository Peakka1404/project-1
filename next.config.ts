import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@univerjs/core",
    "@univerjs/design",
    "@univerjs/engine-formula",
    "@univerjs/engine-render",
    "@univerjs/sheets",
    "@univerjs/sheets-formula",
    "@univerjs/sheets-ui",
    "@univerjs/ui",
  ],
};

export default nextConfig;
