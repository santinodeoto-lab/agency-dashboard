import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKeyPrefix = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)

  let user = null
  let authError = null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    user = data.user ? { id: data.user.id, email: data.user.email } : null
    authError = error?.message ?? null
  } catch (e) {
    authError = e instanceof Error ? e.message : 'unknown'
  }

  return NextResponse.json({
    supabaseUrl,
    anonKeyPrefix,
    cookieNames: allCookies.map(c => c.name),
    cookieCount: allCookies.length,
    user,
    authError,
  })
}
