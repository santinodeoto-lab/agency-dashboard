import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const loginErrorUrl = new URL('/login?error=invalid', request.url)

  if (!email || !password) {
    return NextResponse.redirect(loginErrorUrl, { status: 303 })
  }

  const cookiesSet: Array<{ name: string; valueLen: number }> = []

  const response = NextResponse.redirect(new URL('/dashboard', request.url), { status: 303 })

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
            response.cookies.set(name, value, options ?? {})
            cookiesSet.push({ name, valueLen: value.length })
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.redirect(loginErrorUrl, { status: 303 })
  }

  // Agregar header de diagnóstico para verificar que las cookies se están seteando
  response.headers.set('X-Cookies-Set', JSON.stringify(cookiesSet))

  return response
}
