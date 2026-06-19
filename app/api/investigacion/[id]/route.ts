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

  const [{ data: biases }, { data: sales_cycle }, { data: buyer_elements }] = await Promise.all([
    supabase.from('mr_biases').select('*').eq('market_research_id', mr.id),
    supabase.from('mr_sales_cycle').select('*').eq('market_research_id', mr.id).maybeSingle(),
    supabase.from('mr_buyer_elements').select('*').eq('market_research_id', mr.id),
  ])

  return NextResponse.json({ mr_id: mr.id, biases: biases ?? [], sales_cycle, buyer_elements: buyer_elements ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: client_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  return NextResponse.json({ ok: true })
}
