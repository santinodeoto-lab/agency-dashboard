'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const OBJETIVOS = [
  { key: 'sales',    label: 'Ventas online' },
  { key: 'leads',    label: 'Generación de leads' },
  { key: 'whatsapp', label: 'Conversaciones WhatsApp' },
  { key: 'branding', label: 'Posicionamiento de marca' },
]

export default function EditarClientePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const logoRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)

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
    status: 'active',
  })

  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: cliente } = await supabase
        .from('clients')
        .select('*, campaign_objective_types(key)')
        .eq('id', id)
        .single()

      if (cliente) {
        setForm({
          name: cliente.name,
          company_name: cliente.company_name ?? '',
          email: cliente.email ?? '',
          phone: cliente.phone ?? '',
          fee_amount: String(cliente.fee_amount),
          fee_currency: cliente.fee_currency,
          payment_condition: cliente.payment_condition,
          payment_due_day: String(cliente.payment_due_day),
          payment_alert_days: String(cliente.payment_alert_days),
          status: cliente.status,
        })
        setCurrentLogoUrl(cliente.logo_url ?? null)
        setLogoPreview(cliente.logo_url ?? null)

        // Load objectives: prefer new array, fall back to FK
        const existing: string[] = (cliente.objectives && cliente.objectives.length > 0)
          ? cliente.objectives
          : (cliente.campaign_objective_types?.key ? [cliente.campaign_objective_types.key] : [])
        setSelectedObjectives(existing)
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function toggleObjective(key: string) {
    setSelectedObjectives(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let logo_url = currentLogoUrl

    // Upload logo if changed
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${id}/logo.${ext}`
      const { data, error: uploadError } = await supabase.storage
        .from('client-logos')
        .upload(path, logoFile, { upsert: true })
      if (!uploadError && data) {
        const { data: urlData } = supabase.storage.from('client-logos').getPublicUrl(data.path)
        logo_url = `${urlData.publicUrl}?t=${Date.now()}`
      }
    }

    // Resolve FK for backward compat (first objective if any)
    let primaryObjId: string | null = null
    if (selectedObjectives.length > 0) {
      const { data: objData } = await supabase
        .from('campaign_objective_types')
        .select('id')
        .eq('key', selectedObjectives[0])
        .single()
      primaryObjId = objData?.id ?? null
    }

    const res = await fetch(`/api/clientes/${id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.toUpperCase(),
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        fee_amount: parseFloat(form.fee_amount),
        fee_currency: form.fee_currency,
        payment_condition: form.payment_condition,
        payment_due_day: parseInt(form.payment_due_day),
        payment_alert_days: parseInt(form.payment_alert_days),
        status: form.status,
        objectives: selectedObjectives,
        campaign_objective_type_id: primaryObjId,
        logo_url,
        updated_at: new Date().toISOString(),
      }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(`Error: ${json.error ?? 'Intentá de nuevo.'}`)
      setSaving(false)
      return
    }

    router.push(`/dashboard/clientes/${id}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando...</div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
          ← Volver al cliente
        </Link>
        <h1 className="text-xl font-bold mt-1">Editar cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Logo */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Logo del cliente</h2>
          <div className="flex items-center gap-4">
            <div
              onClick={() => logoRef.current?.click()}
              className="w-20 h-20 rounded-xl bg-gray-800 border-2 border-dashed border-gray-600 hover:border-blue-500 flex items-center justify-center cursor-pointer overflow-hidden transition-colors flex-shrink-0"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-600">+</span>
              )}
            </div>
            <div>
              <button type="button" onClick={() => logoRef.current?.click()}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                {logoPreview ? 'Cambiar logo' : 'Subir logo'}
              </button>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG · Recomendado 200×200px</p>
              {logoPreview && (
                <button type="button" onClick={() => { setLogoPreview(null); setLogoFile(null); setCurrentLogoUrl(null) }}
                  className="text-xs text-red-400 hover:text-red-300 mt-1 transition-colors block">
                  Eliminar logo
                </button>
              )}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </div>

        {/* Info básica */}
        <div className="bg-gray-900 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información básica</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Empresa</label>
            <input name="company_name" value={form.company_name} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Teléfono</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Estado</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Objetivos — múltiple selección */}
        <div className="bg-gray-900 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Objetivos de campaña</h2>
          <p className="text-xs text-gray-500">Podés seleccionar uno o más.</p>
          <div className="grid grid-cols-2 gap-2.5">
            {OBJETIVOS.map(obj => {
              const selected = selectedObjectives.includes(obj.key)
              return (
                <button key={obj.key} type="button" onClick={() => toggleObjective(obj.key)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left flex items-center gap-2.5 ${
                    selected
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}>
                  <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 text-xs ${
                    selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-600'
                  }`}>
                    {selected ? '✓' : ''}
                  </span>
                  {obj.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Finanzas */}
        <div className="bg-gray-900 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Finanzas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Fee mensual *</label>
              <input name="fee_amount" type="number" value={form.fee_amount} onChange={handleChange} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Moneda</label>
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
              <label className="block text-sm text-gray-400 mb-1.5">Condición de pago</label>
              <select name="payment_condition" value={form.payment_condition} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                <option value="advance">Adelantado</option>
                <option value="arrears">Mes vencido</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Día de vencimiento</label>
              <input name="payment_due_day" type="number" min="1" max="31" value={form.payment_due_day} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pb-6">
          <Link href={`/dashboard/clientes/${id}`}
            className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-lg transition-colors text-sm">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors text-sm">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
