import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function logout(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url), { status: 303 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()
  response.cookies.set('user_role', '', { path: '/', maxAge: 0 })

  return response
}

export async function POST(request: NextRequest) {
  return logout(request)
}

export async function GET(request: NextRequest) {
  return logout(request)
}
