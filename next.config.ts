import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ahtsflcbwknsastlpwzs.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
