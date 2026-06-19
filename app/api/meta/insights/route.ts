import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const LEVEL_FIELDS: Record<string, string> = {
  account: '',
  campaign: 'campaign_name,campaign_id,',
  adset: 'adset_name,adset_id,campaign_name,',
  ad: 'ad_name,ad_id,adset_name,campaign_name,',
}

const BASE_FIELDS = 'spend,reach,impressions,clicks,actions,action_values'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const client_id = request.nextUrl.searchParams.get('client_id')
  const since = request.nextUrl.searchParams.get('since')
  const until = request.nextUrl.searchParams.get('until')
  const level = request.nextUrl.searchParams.get('level') ?? 'account'

  if (!client_id || !since || !until) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const { data: connections } = await supabase
    .from('ad_platform_connections')
    .select('account_id, account_name, access_token')
    .eq('client_id', client_id)
    .eq('platform', 'meta')
    .eq('status', 'active')

  if (!connections || connections.length === 0) {
    return NextResponse.json({ rows: [], errors: ['Sin cuentas activas'] })
  }

  const fields = (LEVEL_FIELDS[level] ?? '') + BASE_FIELDS

  const results = await Promise.all(
    connections.map(async (conn) => {
      // Fetch account currency alongside insights
      const [insightsRes, accountRes] = await Promise.all([
        fetch(
          `https://graph.facebook.com/v19.0/act_${conn.account_id}/insights` +
          `?fields=${fields}&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}&level=${level}&limit=500&access_token=${conn.access_token}`
        ),
        fetch(
          `https://graph.facebook.com/v19.0/act_${conn.account_id}?fields=currency&access_token=${conn.access_token}`
        ),
      ])

      const insightsJson = await insightsRes.json()
      const accountJson = await accountRes.json()

      if (insightsJson.error) {
        return { rows: [], error: insightsJson.error.message as string }
      }

      const currency: string = accountJson.currency ?? 'USD'

      const rows = (insightsJson.data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        account_name: conn.account_name,
        currency,
      }))

      return { rows, error: null }
    })
  )

  const allRows = results.flatMap((r) => r.rows)
  const errors = results.filter((r) => r.error).map((r) => r.error)

  return NextResponse.json({ rows: allRows, errors: errors.length > 0 ? errors : null })
}
