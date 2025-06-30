import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "image.tmdb.org",
      "xnvkzwpjneoexvqkfubv.supabase.co", // Supabase storage domain
      "localhost",
      "via.placeholder.com", // Placeholder images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
