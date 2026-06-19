import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession valida el JWT localmente sin llamada de red — más rápido y confiable
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const { pathname } = request.nextUrl

  // Sin sesión → login
  if (!user && pathname !== '/login') {
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Copiar cookies para no perder el refresh
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      response.cookies.set(name, value, opts)
    )
    return response
  }

  // Con sesión en /login → redirigir según rol
  if (user && pathname === '/login') {
    const role = await getRole(user.id)
    return NextResponse.redirect(new URL(role === 'admin' ? '/dashboard' : '/portal', request.url))
  }

  // Rutas /dashboard → solo admin
  if (user && pathname.startsWith('/dashboard')) {
    const role = await getRole(user.id)
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  // Rutas /portal → solo clientes
  if (user && pathname.startsWith('/portal')) {
    const role = await getRole(user.id)
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

async function getRole(userId: string): Promise<string | null> {
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
  const { data } = await admin.from('profiles').select('role').eq('id', userId).single()
  return data?.role ?? null
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
