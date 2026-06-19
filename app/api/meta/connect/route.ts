import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const client_id = request.nextUrl.searchParams.get('client_id')
  if (!client_id) return NextResponse.json({ error: 'Falta client_id' }, { status: 400 })

  const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agency-dashboard-nine-mu.vercel.app'}/api/meta/callback`

  const scopes = ['ads_read', 'read_insights', 'business_management'].join(',')

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', APP_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('scope', scopes)
  url.searchParams.set('state', client_id)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
