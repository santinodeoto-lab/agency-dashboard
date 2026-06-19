import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = 'https://agency-dashboard-nine-mu.vercel.app'
const REDIRECT_URI = `${SITE_URL}/api/meta/callback`

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const client_id = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code || !client_id) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id ?? ''}?meta=error`)
  }

  const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!
  const APP_SECRET = process.env.META_APP_SECRET!

  // 1. Token de corta duración
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id}?meta=error`)
  }

  // 2. Token de larga duración (60 días)
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
  )
  const longData = await longRes.json()
  const access_token = longData.access_token ?? tokenData.access_token
  const expires_in = longData.expires_in ?? 5184000

  // 3. Cuentas publicitarias del usuario
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
  )
  const accountsData = await accountsRes.json()
  const accounts: { id: string; name: string; account_status: number }[] = (accountsData.data ?? [])
    .filter((a: { account_status: number }) => a.account_status === 1)

  if (accounts.length === 0) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/clientes/${client_id}?meta=no_accounts`)
  }

  // 4. Guardar token en cookie y redirigir a página de asignación
  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString()
  const accountsParam = Buffer.from(JSON.stringify(accounts.map(a => ({
    id: a.id.replace('act_', ''),
    name: a.name,
  })))).toString('base64')

  const response = NextResponse.redirect(
    `${SITE_URL}/dashboard/meta/asignar?from_client=${client_id}&accounts=${accountsParam}`
  )

  // Token en cookie httpOnly (seguro, 10 minutos)
  response.cookies.set('meta_pending_token', access_token, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    sameSite: 'lax',
    path: '/',
  })
  response.cookies.set('meta_pending_expires', expires_at, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
