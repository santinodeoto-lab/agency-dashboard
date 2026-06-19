import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = 'https://agency-dashboard-nine-mu.vercel.app'
const REDIRECT_URI = `${SITE_URL}/api/meta/callback`

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const client_id = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code || !client_id) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id}?meta=error`)
  }

  const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!
  const APP_SECRET = process.env.META_APP_SECRET!

  // 1. Intercambiar code por token de corta duración
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id}?meta=error`)
  }

  // 2. Intercambiar por token de larga duración (60 días)
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
  )
  const longData = await longRes.json()
  const access_token = longData.access_token ?? tokenData.access_token
  const expires_in = longData.expires_in ?? 5184000 // 60 días default

  // 3. Obtener cuentas publicitarias del usuario
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
  )
  const accountsData = await accountsRes.json()
  const accounts: { id: string; name: string; account_status: number }[] = accountsData.data ?? []

  if (accounts.length === 0) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id}?meta=no_accounts`)
  }

  const supabase = await createClient()
  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString()

  // 4. Guardar cada cuenta en la base de datos
  for (const account of accounts) {
    if (account.account_status !== 1) continue // 1 = activa
    const account_id = account.id.replace('act_', '')
    await supabase.from('ad_platform_connections').upsert({
      client_id,
      platform: 'meta',
      account_id,
      account_name: account.name,
      access_token,
      token_expires_at: expires_at,
      status: 'active',
    }, { onConflict: 'client_id,platform,account_id' })
  }

  return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id}?meta=connected`)
}
