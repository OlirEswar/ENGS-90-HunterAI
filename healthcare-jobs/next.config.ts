import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/chat': ['./node_modules/pdfjs-dist/**/*'],
  },
};

export default nextConfig;
