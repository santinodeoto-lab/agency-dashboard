'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'buyer' | 'cycle' | 'biases'

const BUYER_ELEMENTS = [
  { key: 'audience',       label: 'Audiencia objetivo',     placeholder: '¿A quién le habla la marca? Edad, intereses, situación de vida...' },
  { key: 'problem',        label: 'Problema principal',     placeholder: '¿Qué dolor o frustración tiene esa audiencia que el producto resuelve?' },
  { key: 'solution',       label: 'Solución que ofrece',    placeholder: '¿Cómo resuelve el producto ese problema?' },
  { key: 'differentials',  label: 'Diferenciales',          placeholder: '¿Por qué elegir esta marca y no la competencia?' },
  { key: 'testimonials',   label: 'Testimonios clave',      placeholder: 'Resultados reales, frases de clientes, casos de éxito...' },
  { key: 'objections',     label: 'Objeciones frecuentes',  placeholder: '¿Qué frena al cliente antes de comprar? Precio, confianza, tiempo...' },
  { key: 'guarantee',      label: 'Garantía',               placeholder: '¿Qué respaldo o garantía ofrece la marca?' },
]

const BIASES = [
  { key: 'reciprocity',       label: 'Reciprocidad',        desc: 'Dar algo de valor antes de pedir.' },
  { key: 'empathy',           label: 'Empatía',             desc: 'Mostrar que entendés el problema del cliente.' },
  { key: 'social_proof',      label: 'Prueba social',       desc: 'Otros ya lo compraron y les fue bien.' },
  { key: 'authority',         label: 'Autoridad',           desc: 'Posicionar la marca como experta.' },
  { key: 'scarcity',          label: 'Escasez',             desc: 'Stock limitado, tiempo limitado.' },
  { key: 'micro_commitment',  label: 'Micro-compromiso',    desc: 'Pasos pequeños que llevan a la compra.' },
]

const CYCLE_FIELDS = [
  { key: 'presentation', label: 'Presentación',  placeholder: '¿Cómo el potencial cliente conoce la marca por primera vez?' },
  { key: 'evaluation',   label: 'Evaluación',    placeholder: '¿Cómo compara opciones antes de decidir?' },
  { key: 'conversion',   label: 'Conversión',    placeholder: '¿Qué lo lleva a tomar la decisión de compra?' },
  { key: 'ascension',    label: 'Ascensión',     placeholder: '¿Cómo se puede ampliar la relación post-compra?' },
]

type MRData = {
  mr_id: string
  biases: { bias_key: string; definition: string; application: string }[]
  sales_cycle: { presentation: string; evaluation: string; conversion: string; ascension: string } | null
  buyer_elements: { element_key: string; data: { content?: string } }[]
}

export default function InvestigacionPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [clientName, setClientName] = useState('')
  const [tab, setTab] = useState<Tab>('buyer')
  const [mrData, setMrData] = useState<MRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Local state for editing
  const [buyerFields, setBuyerFields] = useState<Record<string, string>>({})
  const [cycleFields, setCycleFields] = useState<Record<string, string>>({})
  const [biasFields, setBiasFields] = useState<Record<string, { definition: string; application: string }>>({})

  const loadData = useCallback(async () => {
    const [{ data: client }, res] = await Promise.all([
      supabase.from('clients').select('name').eq('id', id).single(),
      fetch(`/api/investigacion/${id}`),
    ])
    setClientName(client?.name ?? '')
    const data: MRData = await res.json()
    setMrData(data)

    // Hydrate local state
    const buyer: Record<string, string> = {}
    for (const el of data.buyer_elements) buyer[el.element_key] = el.data?.content ?? ''
    setBuyerFields(buyer)

    const cycle: Record<string, string> = {}
    if (data.sales_cycle) {
      for (const f of CYCLE_FIELDS) cycle[f.key] = (data.sales_cycle as Record<string, string>)[f.key] ?? ''
    }
    setCycleFields(cycle)

    const biases: Record<string, { definition: string; application: string }> = {}
    for (const b of data.biases) biases[b.bias_key] = { definition: b.definition ?? '', application: b.application ?? '' }
    setBiasFields(biases)

    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function saveBuyerElement(element_key: string) {
    if (!mrData) return
    setSaving(true)
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'buyer_element', mr_id: mrData.mr_id, element_key, content: buyerFields[element_key] ?? '' }),
    })
    setSaving(false)
    flashSaved()
  }

  async function saveCycle() {
    if (!mrData) return
    setSaving(true)
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'sales_cycle', mr_id: mrData.mr_id, ...cycleFields }),
    })
    setSaving(false)
    flashSaved()
  }

  async function saveBias(bias_key: string) {
    if (!mrData) return
    setSaving(true)
    const { definition, application } = biasFields[bias_key] ?? { definition: '', application: '' }
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'bias', mr_id: mrData.mr_id, bias_key, definition, application }),
    })
    setSaving(false)
    flashSaved()
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {clientName}</Link>
            <h1 className="text-2xl font-bold mt-1">Investigación de mercado</h1>
          </div>
          {saved && <span className="text-green-400 text-sm mt-2">Guardado</span>}
          {saving && <span className="text-gray-400 text-sm mt-2">Guardando...</span>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-8">
          {([
            { key: 'buyer',  label: 'Elementos del comprador' },
            { key: 'cycle',  label: 'Ciclo de ventas' },
            { key: 'biases', label: 'Sesgos psicológicos' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Elementos del comprador */}
        {tab === 'buyer' && (
          <div className="space-y-5">
            {BUYER_ELEMENTS.map(el => (
              <div key={el.key} className="bg-gray-900 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-semibold text-sm">{el.label}</label>
                  <button onClick={() => saveBuyerElement(el.key)} disabled={saving}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                    Guardar
                  </button>
                </div>
                <textarea
                  value={buyerFields[el.key] ?? ''}
                  onChange={e => setBuyerFields(f => ({ ...f, [el.key]: e.target.value }))}
                  rows={3}
                  placeholder={el.placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* Ciclo de ventas */}
        {tab === 'cycle' && (
          <div className="bg-gray-900 rounded-xl p-6 space-y-5">
            <p className="text-gray-400 text-sm">Describí cómo fluye el cliente desde que descubre la marca hasta que vuelve a comprar.</p>
            {CYCLE_FIELDS.map((f, i) => (
              <div key={f.key}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <label className="font-semibold text-sm">{f.label}</label>
                </div>
                <textarea
                  value={cycleFields[f.key] ?? ''}
                  onChange={e => setCycleFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  rows={3}
                  placeholder={f.placeholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            ))}
            <button onClick={saveCycle} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              Guardar ciclo de ventas
            </button>
          </div>
        )}

        {/* Sesgos psicológicos */}
        {tab === 'biases' && (
          <div className="space-y-5">
            {BIASES.map(bias => (
              <div key={bias.key} className="bg-gray-900 rounded-xl p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-sm">{bias.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{bias.desc}</p>
                  </div>
                  <button onClick={() => saveBias(bias.key)} disabled={saving}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-4">
                    Guardar
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">¿Cómo aplica a este cliente?</label>
                    <textarea
                      value={biasFields[bias.key]?.definition ?? ''}
                      onChange={e => setBiasFields(f => ({ ...f, [bias.key]: { ...f[bias.key], definition: e.target.value } }))}
                      rows={2}
                      placeholder="Explicá cómo se puede usar este sesgo en la comunicación de este cliente..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Ejemplo de aplicación en los ads</label>
                    <textarea
                      value={biasFields[bias.key]?.application ?? ''}
                      onChange={e => setBiasFields(f => ({ ...f, [bias.key]: { ...f[bias.key], application: e.target.value } }))}
                      rows={2}
                      placeholder="Ejemplo concreto: copy, creatividad, oferta..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
