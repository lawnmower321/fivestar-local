import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Pre-Phase-2 URL shape. Non-permanent while the tree still evolves.
        source: "/admin/businesses/:id",
        destination: "/admin/clients/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
