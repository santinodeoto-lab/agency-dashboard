'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

const OBJETIVOS = [
  { key: 'sales', label: 'Ventas online' },
  { key: 'leads', label: 'Generación de leads' },
  { key: 'whatsapp', label: 'Conversaciones WhatsApp' },
  { key: 'branding', label: 'Posicionamiento de marca' },
]

type ConvertModal = {
  opp: Opportunity
  fee_amount: string
  fee_currency: string
  payment_condition: string
  payment_due_day: string
  primary_objective: string
}

export default function PipelinePage() {
  const supabase = createClient()
  const router = useRouter()
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [convertModal, setConvertModal] = useState<ConvertModal | null>(null)

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

  function openConvertModal(opp: Opportunity) {
    setConvertModal({
      opp,
      fee_amount: opp.expected_monthly_value?.toString() ?? '',
      fee_currency: opp.currency ?? 'USD',
      payment_condition: 'advance',
      payment_due_day: '10',
      primary_objective: '',
    })
    setExpandedId(null)
  }

  async function handleConvertToClient() {
    if (!convertModal) return
    setConverting(true)

    const { opp } = convertModal

    const { data: objetivo } = await supabase
      .from('campaign_objective_types')
      .select('id')
      .eq('key', convertModal.primary_objective)
      .maybeSingle()

    const { error } = await supabase.from('clients').insert({
      name: opp.contact_name.toUpperCase(),
      company_name: opp.company_name || null,
      email: opp.email || null,
      phone: opp.phone || null,
      fee_amount: parseFloat(convertModal.fee_amount),
      fee_currency: convertModal.fee_currency,
      payment_condition: convertModal.payment_condition,
      payment_due_day: parseInt(convertModal.payment_due_day),
      payment_alert_days: 3,
      primary_objective_id: objetivo?.id ?? null,
      status: 'active',
    })

    if (error) {
      alert('Error al crear el cliente: ' + error.message)
      setConverting(false)
      return
    }

    await fetch(`/api/pipeline/${opp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'won' }),
    })

    setConvertModal(null)
    setConverting(false)
    await loadOpps()
    router.push('/dashboard/clientes')
  }

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
            <Link prefetch={false} href="/dashboard" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Panel Admin</Link>
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

        {/* Formulario nueva oportunidad */}
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
                      {STAGES.filter(s => s.key !== opp.stage && s.key !== 'won' && s.key !== 'lost').map(s => (
                        <button key={s.key} onClick={() => handleStageChange(opp.id, s.key)} disabled={updating === opp.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          → {s.label}
                        </button>
                      ))}
                      <button onClick={() => openConvertModal(opp)} disabled={updating === opp.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors font-medium">
                        Convertir en cliente
                      </button>
                      <button onClick={() => handleStageChange(opp.id, 'lost')} disabled={updating === opp.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                        Marcar como perdido
                      </button>
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

      {/* Modal convertir a cliente */}
      {convertModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-5 border border-gray-800">
            <div>
              <h2 className="text-lg font-bold">Convertir en cliente</h2>
              <p className="text-gray-400 text-sm mt-1">
                Completá los datos faltantes para dar de alta a <span className="text-white font-medium">{convertModal.opp.contact_name}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Fee mensual acordado</label>
              <div className="flex gap-2">
                <select value={convertModal.fee_currency} onChange={e => setConvertModal(m => m ? { ...m, fee_currency: e.target.value } : m)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option>USD</option><option>ARS</option><option>EUR</option>
                </select>
                <input type="number" value={convertModal.fee_amount} onChange={e => setConvertModal(m => m ? { ...m, fee_amount: e.target.value } : m)}
                  placeholder="350"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Condición de pago</label>
                <select value={convertModal.payment_condition} onChange={e => setConvertModal(m => m ? { ...m, payment_condition: e.target.value } : m)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="advance">Adelantado</option>
                  <option value="arrears">Mes vencido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Día de vencimiento</label>
                <input type="number" min="1" max="31" value={convertModal.payment_due_day}
                  onChange={e => setConvertModal(m => m ? { ...m, payment_due_day: e.target.value } : m)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">Objetivo de campaña</label>
              <div className="grid grid-cols-2 gap-2">
                {OBJETIVOS.map(obj => (
                  <button key={obj.key} type="button"
                    onClick={() => setConvertModal(m => m ? { ...m, primary_objective: obj.key } : m)}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-colors text-left ${
                      convertModal.primary_objective === obj.key
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}>
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setConvertModal(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleConvertToClient} disabled={converting || !convertModal.fee_amount}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {converting ? 'Creando...' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
