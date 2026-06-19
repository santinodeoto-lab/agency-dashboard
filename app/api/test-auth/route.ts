import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Endpoint temporal de diagnóstico — eliminar después
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const password = url.searchParams.get('password')

  if (!email || !password) {
    return NextResponse.json({ error: 'Pasá ?email=...&password=... en la URL' })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  return NextResponse.json({
    success: !!data.user,
    userId: data.user?.id ?? null,
    userEmail: data.user?.email ?? null,
    hasSession: !!data.session,
    error: error?.message ?? null,
    errorStatus: error?.status ?? null,
  })
}
