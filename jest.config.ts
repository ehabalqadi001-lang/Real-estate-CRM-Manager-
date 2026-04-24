import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // تحديد مسار تطبيق Next.js لتحميل ملفات .env.test وما شابهها
  dir: './',
})

// الإعدادات المخصصة لبيئة مشروعك
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // ملف يتم تشغيله تلقائياً قبل كل اختبار
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // مطابقة الـ path aliases لتتوافق مع tsconfig.json الخاص بك
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)