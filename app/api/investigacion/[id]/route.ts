import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: client_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let { data: mr } = await supabase
    .from('market_research')
    .select('id')
    .eq('client_id', client_id)
    .maybeSingle()

  if (!mr) {
    const { data: created } = await supabase
      .from('market_research')
      .insert({ client_id })
      .select('id')
      .single()
    mr = created
  }

  if (!mr) return NextResponse.json({ error: 'Error al inicializar' }, { status: 500 })

  const [{ data: biases }, { data: sales_cycle }, { data: buyer_elements }, { data: competitors }] = await Promise.all([
    supabase.from('mr_biases').select('*').eq('market_research_id', mr.id),
    supabase.from('mr_sales_cycle').select('*').eq('market_research_id', mr.id).maybeSingle(),
    supabase.from('mr_buyer_elements').select('*').eq('market_research_id', mr.id),
    supabase.from('mr_competitors').select('*').eq('market_research_id', mr.id).order('created_at'),
  ])

  return NextResponse.json({ mr_id: mr.id, biases: biases ?? [], sales_cycle, buyer_elements: buyer_elements ?? [], competitors: competitors ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: client_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // suppress unused warning
  void client_id

  const { section, mr_id, ...payload } = await req.json()

  if (section === 'sales_cycle') {
    const existing = await supabase.from('mr_sales_cycle').select('id').eq('market_research_id', mr_id).maybeSingle()
    if (existing.data) {
      await supabase.from('mr_sales_cycle').update({ ...payload, status: 'complete' }).eq('market_research_id', mr_id)
    } else {
      await supabase.from('mr_sales_cycle').insert({ market_research_id: mr_id, ...payload, status: 'complete' })
    }
  }

  if (section === 'bias') {
    const { bias_key, ...rest } = payload
    await supabase.from('mr_biases').upsert(
      { market_research_id: mr_id, bias_key, ...rest, status: 'complete' },
      { onConflict: 'market_research_id,bias_key' }
    )
  }

  if (section === 'buyer_element') {
    const { element_key, content } = payload
    await supabase.from('mr_buyer_elements').upsert(
      { market_research_id: mr_id, element_key, data: { content }, status: 'complete' },
      { onConflict: 'market_research_id,element_key' }
    )
  }

  if (section === 'competitor_add') {
    const { name, ig_url, runs_meta_ads, ad_library_url } = payload
    const { data } = await supabase.from('mr_competitors').insert({
      market_research_id: mr_id, name, ig_url: ig_url || null,
      runs_meta_ads: runs_meta_ads ?? false, ad_library_url: ad_library_url || null,
    }).select().single()
    return NextResponse.json(data)
  }

  if (section === 'competitor_update') {
    const { competitor_id, ...rest } = payload
    await supabase.from('mr_competitors').update(rest).eq('id', competitor_id)
  }

  if (section === 'competitor_delete') {
    await supabase.from('mr_competitors').delete().eq('id', payload.competitor_id)
  }

  return NextResponse.json({ ok: true })
}
