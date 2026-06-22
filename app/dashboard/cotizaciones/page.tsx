'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Quote = {
  id: string
  client_name: string
  company_name: string | null
  objective: string | null
  platforms: string[] | null
  fee_amount: number | null
  fee_currency: string
  status: string
  validity_days: number
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', accepted: 'Aceptada', rejected: 'Rechazada',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  sent: 'bg-blue-500/20 text-blue-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}
const PLATFORMS = [
  { key: 'meta', label: 'Meta Ads' },
  { key: 'google', label: 'Google Ads' },
  { key: 'tiktok', label: 'TikTok Ads' },
]

function fmtMoney(n: number | null, cur: string) {
  if (n == null) return '—'
  if (cur === 'ARS') return `$ ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
  return `${cur} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CotizacionesPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    client_name: '', company_name: '', objective: '',
    platforms: ['meta'] as string[],
    fee_amount: '', fee_currency: 'USD',
    ad_spend_suggestion: '', ad_spend_currency: 'USD',
    discount_note: '', validity_days: '7',
  })

  async function load() {
    const { data } = await supabase
      .from('quotes')
      .select('id, client_name, company_name, objective, platforms, fee_amount, fee_currency, status, validity_days, created_at')
      .order('created_at', { ascending: false })
    setQuotes((data as Quote[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function togglePlatform(key: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(key) ? f.platforms.filter(p => p !== key) : [...f.platforms, key],
    }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const feeAmount = form.fee_amount ? parseFloat(form.fee_amount) : null

    // 1. Crear la oportunidad en el pipeline (etapa "Propuesta enviada")
    const { data: opp } = await supabase.from('pipeline_opportunities').insert({
      contact_name: form.client_name,
      company_name: form.company_name || null,
      stage: 'proposal_sent',
      expected_monthly_value: feeAmount,
      currency: form.fee_currency,
      close_probability: 50,
    }).select('id').single()

    // 2. Crear la cotización vinculada a esa oportunidad
    const { data, error: err } = await supabase.from('quotes').insert({
      client_name: form.client_name,
      company_name: form.company_name || null,
      objective: form.objective || null,
      platforms: form.platforms,
      fee_amount: feeAmount,
      fee_currency: form.fee_currency,
      ad_spend_suggestion: form.ad_spend_suggestion ? parseFloat(form.ad_spend_suggestion) : null,
      ad_spend_currency: form.ad_spend_currency,
      discount_note: form.discount_note || null,
      validity_days: parseInt(form.validity_days) || 7,
      opportunity_id: opp?.id ?? null,
    }).select('id').single()
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setForm({ client_name: '', company_name: '', objective: '', platforms: ['meta'], fee_amount: '', fee_currency: 'USD', ad_spend_suggestion: '', ad_spend_currency: 'USD', discount_note: '', validity_days: '7' })
    if (data) window.location.href = `/dashboard/cotizaciones/${data.id}`
  }

  async function handleDelete(e: React.MouseEvent, quote: Quote) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`¿Eliminar la cotización de ${quote.client_name}?`)) return
    await supabase.from('quotes').delete().eq('id', quote.id)
    setQuotes(qs => qs.filter(q => q.id !== quote.id))
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-200">Cotizaciones</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {showForm ? 'Cancelar' : '+ Nueva cotización'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nombre del cliente *</label>
              <input required value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Empresa</label>
              <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Objetivo general</label>
            <input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
              placeholder="Ej: Maximizar las ventas e-commerce"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Plataformas</label>
            <div className="flex gap-2">
              {PLATFORMS.map(p => (
                <button key={p.key} type="button" onClick={() => togglePlatform(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.platforms.includes(p.key) ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Fee de gestión</label>
              <div className="flex gap-2">
                <input type="number" value={form.fee_amount} onChange={e => setForm(f => ({ ...f, fee_amount: e.target.value }))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                <select value={form.fee_currency} onChange={e => setForm(f => ({ ...f, fee_currency: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500">
                  <option>USD</option><option>ARS</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Inversión mínima sugerida (Ad Spend)</label>
              <div className="flex gap-2">
                <input type="number" value={form.ad_spend_suggestion} onChange={e => setForm(f => ({ ...f, ad_spend_suggestion: e.target.value }))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                <select value={form.ad_spend_currency} onChange={e => setForm(f => ({ ...f, ad_spend_currency: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500">
                  <option>USD</option><option>ARS</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nota de descuento (opcional)</label>
              <input value={form.discount_note} onChange={e => setForm(f => ({ ...f, discount_note: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Validez (días)</label>
              <input type="number" value={form.validity_days} onChange={e => setForm(f => ({ ...f, validity_days: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            {saving ? 'Creando...' : 'Crear y ver propuesta'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : quotes.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin cotizaciones todavía.</p>
      ) : (
        <div className="space-y-2">
          {quotes.map(q => (
            <Link key={q.id} href={`/dashboard/cotizaciones/${q.id}`}
              className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 transition-colors">
              <div className="min-w-0">
                <p className="font-semibold text-white">{q.client_name}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {q.objective ?? 'Sin objetivo definido'} · {(q.platforms ?? []).map(p => p.toUpperCase()).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-sm font-medium text-gray-300">{fmtMoney(q.fee_amount, q.fee_currency)}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[q.status]}`}>
                  {STATUS_LABELS[q.status]}
                </span>
                <button onClick={(e) => handleDelete(e, q)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none px-1"
                  title="Eliminar cotización">×</button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
