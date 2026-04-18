import type { NextRequest } from 'next/server'
import { proxy } from './src/proxy'

export default function middleware(req: NextRequest) {
  return proxy(req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
