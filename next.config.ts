import type { NextConfig } from "next";

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
};

export default nextConfig;
