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

  // Creamos la respuesta de redirect primero para poder agregarle las cookies
  let redirectUrl = new URL('/dashboard', request.url)
  const response = NextResponse.redirect(redirectUrl, { status: 303 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Setear en la respuesta de redirect directamente
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {})
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.redirect(loginErrorUrl, { status: 303 })
  }

  // Verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirectUrl = new URL('/portal', request.url)
    // Crear nueva respuesta con el redirect correcto pero conservando las cookies
    const portalResponse = NextResponse.redirect(redirectUrl, { status: 303 })
    response.cookies.getAll().forEach(({ name, value, ...opts }) => {
      portalResponse.cookies.set(name, value, opts)
    })
    return portalResponse
  }

  return response
}
