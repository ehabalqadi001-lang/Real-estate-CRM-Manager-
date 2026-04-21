import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path((?!api|_next|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$).*)',
          has: [
            {
              type: 'header',
              key: 'x-tenant-subdomain',
              value: '(?<subdomain>[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)',
            },
          ],
          destination: '/app/:subdomain/:path*',
        },
        {
          source: '/:path((?!api|_next|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$).*)',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>(?!www|app|admin|api|fastinvestment|ehab-eslam-crm)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\\.fastinvestment\\.com',
            },
          ],
          destination: '/app/:subdomain/:path*',
        },
      ],
    }
  },
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

export default withNextIntl(nextConfig)
