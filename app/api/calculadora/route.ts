import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { client_id, mode, currency, target_revenue, avg_ticket, margin_pct, conversion_rate, label, set_active } = body

  const sales_needed = target_revenue / avg_ticket
  const target_cpa = avg_ticket * margin_pct
  const investment_needed = target_revenue * margin_pct
  const target_roas = 1 / margin_pct
  const target_cpl = mode === 'leads' ? target_cpa * (conversion_rate ?? 0.05) : null
  const leads_needed = mode === 'leads' ? sales_needed / (conversion_rate ?? 0.05) : null

  if (set_active) {
    await supabase.from('budget_calculations').update({ is_active_target: false }).eq('client_id', client_id)
  }

  const { error, data } = await supabase.from('budget_calculations').insert({
    client_id,
    label,
    mode,
    currency,
    target_revenue,
    avg_ticket,
    margin_pct,
    conversion_rate: conversion_rate ?? null,
    sales_needed,
    target_cpa,
    investment_needed,
    target_roas,
    target_cpl,
    leads_needed,
    is_active_target: set_active ?? false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
