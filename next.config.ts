/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات اللغات التي تمنع الـ 404
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'ar',
    localeDetection: true,
  },
}
module.exports = nextConfig