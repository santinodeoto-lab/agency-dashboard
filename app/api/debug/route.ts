import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    cookieNames: allCookies.map(c => c.name),
    cookieCount: allCookies.length,
    hasSupabaseCookie: allCookies.some(c => c.name.includes('auth-token')),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  })
}
