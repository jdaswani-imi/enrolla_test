import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/feedback",
        has: [{ type: "query", key: "tab", value: "announcements" }],
        destination: "/communications?tab=announcements",
        permanent: false,
      },
      {
        source: "/feedback",
        has: [{ type: "query", key: "tab", value: "complaints" }],
        destination: "/communications?tab=concerns-tickets",
        permanent: false,
      },
      {
        source: "/feedback",
        has: [{ type: "query", key: "tab", value: "surveys" }],
        destination: "/communications?tab=surveys",
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Supabase, Google Fonts, and the app's own origin are the only trusted sources.
            // Inline styles/scripts are disallowed except where explicitly permitted below.
            value: [
              "default-src 'self'",
              // Scripts: self + inline; Turbopack/React need 'unsafe-eval' in dev for debugging
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              // Styles: self + Google Fonts + inline (Tailwind injects inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Supabase storage + data URIs
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              // Connections: Supabase API/Realtime + self
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
              // Frames: disallow all
              "frame-ancestors 'none'",
              // Form submissions only to self
              "form-action 'self'",
              // HTTPS upgrade
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
