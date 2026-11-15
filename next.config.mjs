/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    "@univerjs/core",
    "@univerjs/design",
    "@univerjs/docs",
    "@univerjs/docs-ui",
    "@univerjs/engine-formula",
    "@univerjs/engine-render",
    "@univerjs/sheets",
    "@univerjs/sheets-formula",
    "@univerjs/sheets-ui",
    "@univerjs/ui",
  ],
};

export default nextConfig;
