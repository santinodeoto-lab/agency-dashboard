import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const access_token = request.cookies.get('meta_pending_token')?.value
  const token_expires_at = request.cookies.get('meta_pending_expires')?.value
  if (!access_token) return NextResponse.json({ error: 'Token expirado, volvé a conectar' }, { status: 400 })

  const { assignments }: { assignments: { account_id: string; account_name: string; client_id: string }[] } = await request.json()

  for (const a of assignments) {
    if (!a.client_id) continue
    await supabase.from('ad_platform_connections').upsert({
      client_id: a.client_id,
      platform: 'meta',
      account_id: a.account_id,
      account_name: a.account_name,
      access_token,
      token_expires_at: token_expires_at ?? null,
      status: 'active',
    }, { onConflict: 'client_id,platform,account_id' })
  }

  return NextResponse.json({ ok: true })
}
