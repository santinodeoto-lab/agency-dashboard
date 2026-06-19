'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Calc = {
  id: string
  label: string | null
  mode: string
  currency: string
  target_revenue: number
  avg_ticket: number
  margin_pct: number
  conversion_rate: number | null
  sales_needed: number
  target_cpa: number
  investment_needed: number
  target_roas: number
  target_cpl: number | null
  leads_needed: number | null
  is_active_target: boolean
  created_at: string
}

export default function CalculadoraPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [clientName, setClientName] = useState('')
  const [history, setHistory] = useState<Calc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<Calc | null>(null)

  const [form, setForm] = useState({
    mode: 'sales',
    currency: 'USD',
    label: '',
    target_revenue: '',
    avg_ticket: '',
    margin_pct: '30',
    conversion_rate: '5',
  })

  async function loadData() {
    const [{ data: client }, { data: calcs }] = await Promise.all([
      supabase.from('clients').select('name').eq('id', id).single(),
      supabase.from('budget_calculations').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    ])
    setClientName(client?.name ?? '')
    setHistory(calcs ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  function calcPreview() {
    const rev = parseFloat(form.target_revenue)
    const ticket = parseFloat(form.avg_ticket)
    const margin = parseFloat(form.margin_pct) / 100
    const conv = parseFloat(form.conversion_rate) / 100
    if (!rev || !ticket || !margin) return null
    const sales_needed = rev / ticket
    const target_cpa = ticket * margin
    const investment_needed = rev * margin
    const target_roas = 1 / margin
    const target_cpl = form.mode === 'leads' ? target_cpa * conv : null
    const leads_needed = form.mode === 'leads' ? sales_needed / conv : null
    return { sales_needed, target_cpa, investment_needed, target_roas, target_cpl, leads_needed }
  }

  const preview = calcPreview()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/calculadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: id,
        label: form.label || null,
        mode: form.mode,
        currency: form.currency,
        target_revenue: parseFloat(form.target_revenue),
        avg_ticket: parseFloat(form.avg_ticket),
        margin_pct: parseFloat(form.margin_pct) / 100,
        conversion_rate: form.mode === 'leads' ? parseFloat(form.conversion_rate) / 100 : null,
        set_active: true,
      }),
    })
    const data = await res.json()
    setResult(data)
    await loadData()
    setSaving(false)
  }

  const fmt = (n: number, decimals = 0) => n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="mb-8">
          <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {clientName || 'Cliente'}</Link>
          <h1 className="text-2xl font-bold mt-1">Calculadora de presupuesto</h1>
          <p className="text-gray-400 text-sm mt-1">Calculá los KPIs objetivo a partir del ticket promedio y cuánto estás dispuesto a invertir en publicidad</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Modo</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-700">
                <button type="button" onClick={() => setForm(f => ({ ...f, mode: 'sales' }))}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.mode === 'sales' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  Ventas directas
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, mode: 'leads' }))}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.mode === 'leads' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  Generación de leads
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Etiqueta (opcional)</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Ej: Campaña Q3 2026"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Moneda</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option>USD</option>
                  <option>ARS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">% dispuesto a invertir en ads</label>
                <input type="number" min="1" max="100" value={form.margin_pct} onChange={e => setForm(f => ({ ...f, margin_pct: e.target.value }))} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Facturación objetivo / mes ({form.currency})</label>
              <input type="number" value={form.target_revenue} onChange={e => setForm(f => ({ ...f, target_revenue: e.target.value }))} required
                placeholder="10000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Ticket promedio ({form.currency})</label>
              <input type="number" value={form.avg_ticket} onChange={e => setForm(f => ({ ...f, avg_ticket: e.target.value }))} required
                placeholder="500"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            {form.mode === 'leads' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Tasa de conversión lead → venta %</label>
                <input type="number" min="0.1" max="100" step="0.1" value={form.conversion_rate} onChange={e => setForm(f => ({ ...f, conversion_rate: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            )}

            <button type="submit" disabled={saving || !preview}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors text-sm">
              {saving ? 'Calculando...' : 'Calcular y guardar como objetivo activo'}
            </button>
          </form>

          {/* Resultado en vivo */}
          <div className="space-y-4">
            {preview ? (
              <div className="bg-gray-900 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-gray-300 text-sm">Vista previa</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs">Inversión en ads / mes</p>
                    <p className="text-2xl font-bold mt-1 text-blue-400">{form.currency} {fmt(preview.investment_needed)}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs">ROAS objetivo</p>
                    <p className="text-2xl font-bold mt-1">{fmt(preview.target_roas, 2)}x</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs">CPA objetivo</p>
                    <p className="text-2xl font-bold mt-1">{form.currency} {fmt(preview.target_cpa)}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs">Ventas necesarias / mes</p>
                    <p className="text-2xl font-bold mt-1">{fmt(preview.sales_needed, 1)}</p>
                  </div>
                  {form.mode === 'leads' && preview.target_cpl != null && (
                    <>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-gray-400 text-xs">CPL objetivo</p>
                        <p className="text-2xl font-bold mt-1">{form.currency} {fmt(preview.target_cpl)}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-gray-400 text-xs">Leads necesarios / mes</p>
                        <p className="text-2xl font-bold mt-1">{preview.leads_needed != null ? fmt(preview.leads_needed, 0) : '—'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl p-6 flex items-center justify-center h-48">
                <p className="text-gray-500 text-sm">Completá los campos para ver la proyección</p>
              </div>
            )}

            {/* Historial */}
            {!loading && history.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5">
                <h2 className="font-semibold text-gray-300 text-sm mb-3">Historial de cálculos</h2>
                <div className="space-y-2">
                  {history.map(calc => (
                    <div key={calc.id} className={`flex items-center justify-between p-3 rounded-lg ${calc.is_active_target ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-gray-800'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{calc.label || new Date(calc.created_at).toLocaleDateString('es-AR')}</p>
                          {calc.is_active_target && <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">Activo</span>}
                        </div>
                        <p className="text-xs text-gray-400">{calc.currency} {fmt(calc.target_revenue)} · CPA {calc.currency} {fmt(calc.target_cpa)} · ROAS {fmt(calc.target_roas, 2)}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
