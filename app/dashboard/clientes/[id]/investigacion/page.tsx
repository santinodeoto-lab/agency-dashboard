'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'buyer' | 'cycle' | 'biases' | 'competitors'

const BUYER_ELEMENTS = [
  { key: 'audience',      label: 'Audiencia objetivo',    placeholder: 'Ej: Mujeres de 28-45 años, interesadas en bienestar y vida saludable, que trabajan y tienen poco tiempo para cocinar...' },
  { key: 'problem',       label: 'Problema principal',    placeholder: 'Ej: Quieren comer sano pero no saben cómo, no tienen tiempo para planificar y terminan pidiendo delivery...' },
  { key: 'solution',      label: 'Solución que ofrece',   placeholder: 'Ej: Planes de comida semanales listos para preparar en menos de 20 minutos, con ingredientes frescos...' },
  { key: 'differentials', label: 'Diferenciales',         placeholder: 'Ej: Sin contrato de permanencia, ingredientes orgánicos certificados, recetas de nutricionista...' },
  { key: 'testimonials',  label: 'Testimonios clave',     placeholder: 'Ej: "Bajé 5kg en 2 meses sin pasar hambre" — María, 34 años. Tasa de renovación del 78%...' },
  { key: 'objections',    label: 'Objeciones frecuentes', placeholder: 'Ej: "Es muy caro" → mostrar costo vs delivery diario. "No tengo tiempo" → destacar los 20 min de prep...' },
  { key: 'guarantee',     label: 'Garantía',              placeholder: 'Ej: Si no te gusta tu primera caja, te devolvemos el dinero sin preguntas...' },
]

const BIASES = [
  {
    key: 'reciprocity',
    label: 'Reciprocidad',
    desc: 'Dar algo de valor antes de pedir.',
    defPlaceholder: 'Ej: Ofrecemos una guía gratuita, muestra de producto o clase de prueba antes de presentar el precio. La persona siente que ya recibió algo y es más propensa a comprar.',
    appPlaceholder: 'Ej: Anuncio que regala "La guía de los 5 errores al comprar [producto]" → formulario de lead → seguimiento con oferta.',
  },
  {
    key: 'empathy',
    label: 'Empatía',
    desc: 'Mostrar que entendés el problema del cliente.',
    defPlaceholder: 'Ej: El copy arranca hablando del dolor exacto del cliente, no del producto. La persona siente que la marca la entiende antes de ver qué vende.',
    appPlaceholder: 'Ej: "¿Cansado de invertir en publicidad y no ver resultados? Nosotros también lo vivimos. Por eso creamos..."',
  },
  {
    key: 'social_proof',
    label: 'Prueba social',
    desc: 'Otros ya lo compraron y les fue bien.',
    defPlaceholder: 'Ej: Mostrar cantidad de clientes, reseñas reales, capturas de WhatsApp con resultados, videos de testimonios...',
    appPlaceholder: 'Ej: "+800 familias ya eligieron [marca] este mes" con foto de clientes reales. O carrusel de reviews con foto y nombre.',
  },
  {
    key: 'authority',
    label: 'Autoridad',
    desc: 'Posicionar la marca como experta.',
    defPlaceholder: 'Ej: Mencionar años de experiencia, apariciones en medios, certificaciones, cantidad de casos resueltos o clientes atendidos.',
    appPlaceholder: 'Ej: "Como vimos en [Medio]..." o "Más de 10 años y +2.000 clientes nos respaldan" como headline del anuncio.',
  },
  {
    key: 'scarcity',
    label: 'Escasez',
    desc: 'Stock limitado, tiempo limitado.',
    defPlaceholder: 'Ej: Generar urgencia real: cupos limitados, precio de lanzamiento por tiempo definido, edición especial con stock acotado.',
    appPlaceholder: 'Ej: "Solo quedan 8 lugares para el turno de julio" o "Precio especial válido hasta el domingo 23:59hs".',
  },
  {
    key: 'micro_commitment',
    label: 'Micro-compromiso',
    desc: 'Pasos pequeños que llevan a la compra.',
    defPlaceholder: 'Ej: En vez de pedir la compra directa, primero pedimos un paso mínimo (click, registro, consulta gratuita). Reduce la fricción inicial.',
    appPlaceholder: 'Ej: CTA del anuncio → "Pedí tu cotización sin cargo" o "Agendá una llamada gratuita de 15 min" en lugar de "Comprá ahora".',
  },
]

const CYCLE_FIELDS = [
  { key: 'presentation', label: 'Presentación',  placeholder: 'Ej: El cliente nos descubre por un reel de Instagram o un anuncio en el feed. Primera impresión: precio accesible y diseño atractivo.' },
  { key: 'evaluation',   label: 'Evaluación',    placeholder: 'Ej: Visita el perfil, mira destacados, busca reseñas en Google y compara con 2 o 3 competidores antes de consultar.' },
  { key: 'conversion',   label: 'Conversión',    placeholder: 'Ej: Manda un DM o completa el formulario. Cierra cuando recibe una respuesta rápida con precio claro y testimonio.' },
  { key: 'ascension',    label: 'Ascensión',     placeholder: 'Ej: Después de la primera compra, se le ofrece un plan mayor o un producto complementario vía email o WhatsApp.' },
]

type Competitor = {
  id: string
  name: string
  ig_url: string | null
  runs_meta_ads: boolean
  ad_library_url: string | null
}

type MRData = {
  mr_id: string
  biases: { bias_key: string; definition: string; application: string }[]
  sales_cycle: Record<string, string> | null
  buyer_elements: { element_key: string; data: { content?: string } }[]
  competitors: Competitor[]
}

export default function InvestigacionPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [clientName, setClientName] = useState('')
  const [tab, setTab] = useState<Tab>('buyer')
  const [mrData, setMrData] = useState<MRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [buyerFields, setBuyerFields] = useState<Record<string, string>>({})
  const [cycleFields, setCycleFields] = useState<Record<string, string>>({})
  const [biasFields, setBiasFields] = useState<Record<string, { definition: string; application: string }>>({})
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [newComp, setNewComp] = useState({ name: '', ig_url: '', runs_meta_ads: false, ad_library_url: '' })
  const [addingComp, setAddingComp] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(async () => {
    const [{ data: client }, res] = await Promise.all([
      supabase.from('clients').select('name').eq('id', id).single(),
      fetch(`/api/investigacion/${id}`),
    ])
    setClientName(client?.name ?? '')
    const data: MRData = await res.json()
    setMrData(data)

    const buyer: Record<string, string> = {}
    for (const el of data.buyer_elements) buyer[el.element_key] = el.data?.content ?? ''
    setBuyerFields(buyer)

    const cycle: Record<string, string> = {}
    if (data.sales_cycle) {
      for (const f of CYCLE_FIELDS) cycle[f.key] = data.sales_cycle[f.key] ?? ''
    }
    setCycleFields(cycle)

    const biases: Record<string, { definition: string; application: string }> = {}
    for (const b of data.biases) biases[b.bias_key] = { definition: b.definition ?? '', application: b.application ?? '' }
    setBiasFields(biases)

    setCompetitors(data.competitors)
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  function flashSaved() {
    setSaveStatus('saved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000)
  }

  async function autoSaveBuyer(element_key: string, value: string) {
    if (!mrData) return
    setSaveStatus('saving')
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'buyer_element', mr_id: mrData.mr_id, element_key, content: value }),
    })
    flashSaved()
  }

  async function autoSaveCycle(key: string, value: string) {
    if (!mrData) return
    setSaveStatus('saving')
    const updated = { ...cycleFields, [key]: value }
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'sales_cycle', mr_id: mrData.mr_id, ...updated }),
    })
    flashSaved()
  }

  async function autoSaveBias(bias_key: string, field: 'definition' | 'application', value: string) {
    if (!mrData) return
    setSaveStatus('saving')
    const current = biasFields[bias_key] ?? { definition: '', application: '' }
    const updated = { ...current, [field]: value }
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'bias', mr_id: mrData.mr_id, bias_key, definition: updated.definition, application: updated.application }),
    })
    flashSaved()
  }

  async function addCompetitor() {
    if (!mrData || !newComp.name) return
    setAddingComp(true)
    const res = await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'competitor_add', mr_id: mrData.mr_id, ...newComp }),
    })
    const created = await res.json()
    setCompetitors(c => [...c, created])
    setNewComp({ name: '', ig_url: '', runs_meta_ads: false, ad_library_url: '' })
    setAddingComp(false)
  }

  async function updateCompetitor(comp_id: string, changes: Partial<Competitor>) {
    if (!mrData) return
    setCompetitors(prev => prev.map(c => c.id === comp_id ? { ...c, ...changes } : c))
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'competitor_update', mr_id: mrData.mr_id, competitor_id: comp_id, ...changes }),
    })
    flashSaved()
  }

  async function deleteCompetitor(comp_id: string) {
    if (!mrData) return
    setCompetitors(prev => prev.filter(c => c.id !== comp_id))
    await fetch(`/api/investigacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'competitor_delete', mr_id: mrData.mr_id, competitor_id: comp_id }),
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {clientName}</Link>
            <h1 className="text-2xl font-bold mt-1">Investigación de mercado</h1>
          </div>
          <span className={`text-sm mt-2 transition-opacity ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'} ${saveStatus === 'saved' ? 'text-green-400' : 'text-gray-400'}`}>
            {saveStatus === 'saving' ? 'Guardando...' : 'Guardado'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-8 overflow-x-auto">
          {([
            { key: 'buyer',       label: 'Elementos del comprador' },
            { key: 'cycle',       label: 'Ciclo de ventas' },
            { key: 'biases',      label: 'Sesgos psicológicos' },
            { key: 'competitors', label: 'Competidores' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-2 ${tab === t.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Elementos del comprador */}
        {tab === 'buyer' && (
          <div className="space-y-5">
            {BUYER_ELEMENTS.map(el => (
              <div key={el.key} className="bg-gray-900 rounded-xl p-5">
                <label className="block font-semibold text-sm mb-3">{el.label}</label>
                <textarea
                  value={buyerFields[el.key] ?? ''}
                  onChange={e => setBuyerFields(f => ({ ...f, [el.key]: e.target.value }))}
                  onBlur={e => autoSaveBuyer(el.key, e.target.value)}
                  rows={3}
                  placeholder={el.placeholder}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        )}

        {/* Ciclo de ventas */}
        {tab === 'cycle' && (
          <div className="bg-gray-900 rounded-xl p-6 space-y-5">
            <p className="text-gray-400 text-sm">Describí cómo fluye el cliente desde que descubre la marca hasta que vuelve a comprar. Se guarda automáticamente al salir de cada campo.</p>
            {CYCLE_FIELDS.map((f, i) => (
              <div key={f.key}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <label className="font-semibold text-sm">{f.label}</label>
                </div>
                <textarea
                  value={cycleFields[f.key] ?? ''}
                  onChange={e => setCycleFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  onBlur={e => autoSaveCycle(f.key, e.target.value)}
                  rows={3}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        )}

        {/* Sesgos psicológicos */}
        {tab === 'biases' && (
          <div className="space-y-5">
            {BIASES.map(bias => (
              <div key={bias.key} className="bg-gray-900 rounded-xl p-5">
                <p className="font-semibold text-sm">{bias.label}</p>
                <p className="text-gray-500 text-xs mt-0.5 mb-4">{bias.desc}</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">¿Cómo aplica a este cliente?</label>
                    <textarea
                      value={biasFields[bias.key]?.definition ?? ''}
                      onChange={e => setBiasFields(f => ({ ...f, [bias.key]: { ...f[bias.key], definition: e.target.value } }))}
                      onBlur={e => autoSaveBias(bias.key, 'definition', e.target.value)}
                      rows={2}
                      placeholder={bias.defPlaceholder}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Ejemplo de aplicación en los ads</label>
                    <textarea
                      value={biasFields[bias.key]?.application ?? ''}
                      onChange={e => setBiasFields(f => ({ ...f, [bias.key]: { ...f[bias.key], application: e.target.value } }))}
                      onBlur={e => autoSaveBias(bias.key, 'application', e.target.value)}
                      rows={2}
                      placeholder={bias.appPlaceholder}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Competidores */}
        {tab === 'competitors' && (
          <div className="space-y-4">
            {competitors.map(comp => (
              <div key={comp.id} className="bg-gray-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <input
                    value={comp.name}
                    onChange={e => setCompetitors(prev => prev.map(c => c.id === comp.id ? { ...c, name: e.target.value } : c))}
                    onBlur={e => updateCompetitor(comp.id, { name: e.target.value })}
                    placeholder="Nombre del competidor"
                    className="bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-transparent hover:border-gray-600 focus:border-blue-500 pb-0.5 transition-colors"
                  />
                  <button onClick={() => deleteCompetitor(comp.id)} className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">URL perfil de Instagram</label>
                  <input
                    value={comp.ig_url ?? ''}
                    onChange={e => setCompetitors(prev => prev.map(c => c.id === comp.id ? { ...c, ig_url: e.target.value } : c))}
                    onBlur={e => updateCompetitor(comp.id, { ig_url: e.target.value })}
                    placeholder="https://instagram.com/competidor"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCompetitor(comp.id, { runs_meta_ads: !comp.runs_meta_ads })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${comp.runs_meta_ads ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    <span className={`w-3 h-3 rounded-full ${comp.runs_meta_ads ? 'bg-blue-400' : 'bg-gray-600'}`} />
                    {comp.runs_meta_ads ? 'Hace Meta Ads' : 'No hace Meta Ads'}
                  </button>
                </div>

                {comp.runs_meta_ads && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">URL Biblioteca de anuncios</label>
                    <input
                      value={comp.ad_library_url ?? ''}
                      onChange={e => setCompetitors(prev => prev.map(c => c.id === comp.id ? { ...c, ad_library_url: e.target.value } : c))}
                      onBlur={e => updateCompetitor(comp.id, { ad_library_url: e.target.value })}
                      placeholder="https://www.facebook.com/ads/library/?..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    {comp.ad_library_url && (
                      <a href={comp.ad_library_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                        Abrir biblioteca →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Agregar competidor */}
            <div className="bg-gray-900 rounded-xl p-5 border border-dashed border-gray-700 space-y-4">
              <p className="text-sm font-semibold text-gray-400">+ Agregar competidor</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nombre *</label>
                  <input value={newComp.name} onChange={e => setNewComp(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre del competidor"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Perfil de Instagram</label>
                  <input value={newComp.ig_url} onChange={e => setNewComp(f => ({ ...f, ig_url: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setNewComp(f => ({ ...f, runs_meta_ads: !f.runs_meta_ads }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${newComp.runs_meta_ads ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                  <span className={`w-3 h-3 rounded-full ${newComp.runs_meta_ads ? 'bg-blue-400' : 'bg-gray-600'}`} />
                  {newComp.runs_meta_ads ? 'Hace Meta Ads' : 'No hace Meta Ads'}
                </button>
                {newComp.runs_meta_ads && (
                  <input value={newComp.ad_library_url} onChange={e => setNewComp(f => ({ ...f, ad_library_url: e.target.value }))}
                    placeholder="URL Biblioteca de anuncios"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                )}
              </div>
              <button onClick={addCompetitor} disabled={addingComp || !newComp.name}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {addingComp ? 'Guardando...' : 'Agregar competidor'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
