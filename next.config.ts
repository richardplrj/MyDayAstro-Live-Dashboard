import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Hides the Next.js development indicator (corner logo) in local dev. */
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Google auth popup can warn about window.close under strict COOP.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
