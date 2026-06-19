'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Opportunity = {
  id: string
  contact_name: string
  company_name: string | null
  email: string | null
  phone: string | null
  stage: string
  expected_monthly_value: number | null
  currency: string
  close_probability: number | null
  expected_close_date: string | null
  notes: string | null
}

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'border-gray-500' },
  { key: 'contacted', label: 'Contactado', color: 'border-blue-500' },
  { key: 'proposal_sent', label: 'Propuesta enviada', color: 'border-yellow-500' },
  { key: 'negotiating', label: 'Negociando', color: 'border-orange-500' },
  { key: 'won', label: 'Ganado', color: 'border-green-500' },
  { key: 'lost', label: 'Perdido', color: 'border-red-500' },
]

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-700 text-gray-300',
  contacted: 'bg-blue-500/20 text-blue-400',
  proposal_sent: 'bg-yellow-500/20 text-yellow-400',
  negotiating: 'bg-orange-500/20 text-orange-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
}

export default function PipelinePage() {
  const supabase = createClient()
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    stage: 'lead',
    expected_monthly_value: '',
    currency: 'USD',
    close_probability: '50',
    expected_close_date: '',
    notes: '',
  })

  async function loadOpps() {
    const { data } = await supabase
      .from('pipeline_opportunities')
      .select('*')
      .not('stage', 'in', '("won","lost")')
      .order('created_at', { ascending: false })
    setOpps(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadOpps() }, [])

  async function handleStageChange(id: string, stage: string) {
    setUpdating(id)
    await fetch(`/api/pipeline/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    await loadOpps()
    setUpdating(null)
  }

  async function handleDelete(id: string) {
    setUpdating(id)
    await fetch(`/api/pipeline/${id}`, { method: 'DELETE' })
    await loadOpps()
    setUpdating(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_name: form.contact_name,
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        stage: form.stage,
        expected_monthly_value: form.expected_monthly_value ? parseFloat(form.expected_monthly_value) : null,
        currency: form.currency,
        close_probability: form.close_probability ? parseInt(form.close_probability) : null,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes || null,
      }),
    })
    setForm({ contact_name: '', company_name: '', email: '', phone: '', stage: 'lead', expected_monthly_value: '', currency: 'USD', close_probability: '50', expected_close_date: '', notes: '' })
    setShowForm(false)
    await loadOpps()
  }

  const proyeccion = opps.reduce((sum, o) => {
    if (!o.expected_monthly_value || !o.close_probability) return sum
    return sum + (o.expected_monthly_value * o.close_probability / 100)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Panel Admin</Link>
            <h1 className="text-2xl font-bold mt-1">Pipeline</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
            {showForm ? 'Cancelar' : '+ Nueva oportunidad'}
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Oportunidades activas</p>
            <p className="text-3xl font-bold mt-1">{opps.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Valor potencial</p>
            <p className="text-3xl font-bold mt-1">USD {opps.reduce((s, o) => s + (o.expected_monthly_value ?? 0), 0).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Proyección ponderada</p>
            <p className="text-3xl font-bold mt-1 text-blue-400">USD {Math.round(proyeccion).toLocaleString()}</p>
          </div>
        </div>

        {/* Formulario */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-300">Nueva oportunidad</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nombre *</label>
                <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} required
                  placeholder="Nombre del contacto"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Empresa</label>
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Nombre de la empresa"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Teléfono</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Fee mensual esperado</label>
                <div className="flex gap-2">
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option>USD</option><option>ARS</option>
                  </select>
                  <input type="number" value={form.expected_monthly_value} onChange={e => setForm(f => ({ ...f, expected_monthly_value: e.target.value }))}
                    placeholder="350"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Probabilidad de cierre %</label>
                <input type="number" min="0" max="100" value={form.close_probability} onChange={e => setForm(f => ({ ...f, close_probability: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Etapa</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  {STAGES.filter(s => !['won','lost'].includes(s.key)).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Fecha estimada de cierre</label>
                <input type="date" value={form.expected_close_date} onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notas</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              Guardar oportunidad
            </button>
          </form>
        )}

        {/* Lista */}
        {loading ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : opps.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No hay oportunidades activas.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-blue-400 text-sm hover:underline">+ Agregar una</button>
          </div>
        ) : (
          <div className="space-y-3">
            {opps.map(opp => (
              <div key={opp.id} className={`bg-gray-900 rounded-xl border-l-2 ${STAGES.find(s => s.key === opp.stage)?.color ?? 'border-gray-700'}`}>
                <div className="p-5 flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {opp.contact_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{opp.contact_name}</p>
                      {opp.company_name && <p className="text-gray-400 text-xs">{opp.company_name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[opp.stage]}`}>
                      {STAGES.find(s => s.key === opp.stage)?.label}
                    </span>
                    {opp.expected_monthly_value && (
                      <p className="font-bold">{opp.currency} {opp.expected_monthly_value.toLocaleString()}</p>
                    )}
                    {opp.close_probability && (
                      <p className="text-gray-400 text-sm">{opp.close_probability}%</p>
                    )}
                  </div>
                </div>

                {expandedId === opp.id && (
                  <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-3">
                    {opp.notes && <p className="text-gray-300 text-sm">{opp.notes}</p>}
                    {opp.email && <p className="text-gray-400 text-sm">✉ {opp.email}</p>}
                    {opp.phone && <p className="text-gray-400 text-sm">📞 {opp.phone}</p>}
                    {opp.expected_close_date && (
                      <p className="text-gray-400 text-sm">Cierre estimado: {new Date(opp.expected_close_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {STAGES.filter(s => s.key !== opp.stage && s.key !== 'lost').map(s => (
                        <button key={s.key} onClick={() => handleStageChange(opp.id, s.key)} disabled={updating === opp.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          → {s.label}
                        </button>
                      ))}
                      <button onClick={() => handleDelete(opp.id)} disabled={updating === opp.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors ml-auto">
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
