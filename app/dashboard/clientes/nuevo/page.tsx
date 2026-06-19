'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const OBJETIVOS = [
  { key: 'sales', label: 'Ventas online' },
  { key: 'leads', label: 'Generación de leads' },
  { key: 'whatsapp', label: 'Conversaciones WhatsApp' },
  { key: 'branding', label: 'Posicionamiento de marca' },
]

export default function NuevoClientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    fee_amount: '',
    fee_currency: 'USD',
    payment_condition: 'advance',
    payment_due_day: '10',
    payment_alert_days: '3',
    primary_objective: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: objetivo } = await supabase
      .from('campaign_objective_types')
      .select('id')
      .eq('key', form.primary_objective)
      .single()

    const { error } = await supabase.from('clients').insert({
      name: form.name.toUpperCase(),
      company_name: form.company_name || null,
      email: form.email || null,
      phone: form.phone || null,
      fee_amount: parseFloat(form.fee_amount),
      fee_currency: form.fee_currency,
      payment_condition: form.payment_condition,
      payment_due_day: parseInt(form.payment_due_day),
      payment_alert_days: parseInt(form.payment_alert_days),
      primary_objective_id: objetivo?.id ?? null,
      status: 'active',
    })

    if (error) {
      setError('Error al guardar el cliente. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/dashboard/clientes')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href="/dashboard/clientes" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
            ← Clientes
          </Link>
          <h1 className="text-2xl font-bold mt-1">Nuevo cliente</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-300">Información básica</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nombre del cliente *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                placeholder="Ej: NOIRPRESS" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Empresa / Razón social</label>
              <input name="company_name" value={form.company_name} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                placeholder="Ej: NoirPress S.R.L." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="+54 9 11..." />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-300">Finanzas</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Fee mensual *</label>
                <input name="fee_amount" type="number" value={form.fee_amount} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="350" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Moneda *</label>
                <select name="fee_currency" value={form.fee_currency} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="EUR">EUR</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Condición de pago *</label>
                <select name="payment_condition" value={form.payment_condition} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                  <option value="advance">Adelantado</option>
                  <option value="arrears">Mes vencido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Día de vencimiento *</label>
                <input name="payment_due_day" type="number" min="1" max="31" value={form.payment_due_day} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Alertar X días antes del vencimiento</label>
              <input name="payment_alert_days" type="number" min="1" max="30" value={form.payment_alert_days} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-300">Objetivo de campaña</h2>
            <div className="grid grid-cols-2 gap-3">
              {OBJETIVOS.map(obj => (
                <button
                  key={obj.key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, primary_objective: obj.key }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                    form.primary_objective === obj.key
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <Link href="/dashboard/clientes"
              className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-lg transition-colors">
              Cancelar
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors">
              {loading ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
