'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Script = {
  id: string
  position: number
  formato: string | null
  idea: string | null
  guion: string | null
  referencias: string | null
  uploaded: boolean
}

const FORMATOS = ['Video', 'Imagen', 'Carrusel', 'Reel', 'Historia', 'Texto']

export function GuionesEditor({ clientId, creativosUrl }: { clientId: string; creativosUrl: string }) {
  const supabase = createClient()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [creativos, setCreativos] = useState(creativosUrl)
  const [editingCreativos, setEditingCreativos] = useState(false)
  const [savingCreativos, setSavingCreativos] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('client_scripts')
      .select('id, position, formato, idea, guion, referencias, uploaded')
      .eq('client_id', clientId)
      .order('position', { ascending: true })
    setScripts((data as Script[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addScript() {
    const nextPos = scripts.length > 0 ? Math.max(...scripts.map(s => s.position)) + 1 : 0
    const { data } = await supabase.from('client_scripts')
      .insert({ client_id: clientId, position: nextPos, uploaded: false })
      .select('id, position, formato, idea, guion, referencias, uploaded')
      .single()
    if (data) setScripts(s => [...s, data as Script])
  }

  async function updateField(id: string, field: keyof Script, value: string | boolean) {
    setScripts(s => s.map(x => x.id === id ? { ...x, [field]: value } : x))
    await supabase.from('client_scripts').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este guión?')) return
    await supabase.from('client_scripts').delete().eq('id', id)
    setScripts(s => s.filter(x => x.id !== id))
  }

  async function saveCreativos() {
    setSavingCreativos(true)
    await supabase.from('clients').update({ creativos_url: creativos || null }).eq('id', clientId)
    setSavingCreativos(false)
    setEditingCreativos(false)
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500'

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div className="space-y-4">
      {scripts.length === 0 && (
        <p className="text-gray-500 text-sm">Todavía no hay guiones. Agregá el primero.</p>
      )}

      {scripts.map((s, i) => (
        <div key={s.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-blue-400">TF {i + 1}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Subido</span>
                <select value={s.uploaded ? 'si' : 'no'} onChange={e => updateField(s.id, 'uploaded', e.target.value === 'si')}
                  className={`text-xs rounded-md px-2 py-1 border focus:outline-none ${s.uploaded ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
              <button onClick={() => remove(s.id)} className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Formato</label>
              <select value={s.formato ?? ''} onChange={e => updateField(s.id, 'formato', e.target.value)} className={inputCls}>
                <option value="">— Elegir —</option>
                {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Idea del anuncio</label>
              <input value={s.idea ?? ''} onChange={e => setScripts(arr => arr.map(x => x.id === s.id ? { ...x, idea: e.target.value } : x))}
                onBlur={e => updateField(s.id, 'idea', e.target.value)} className={inputCls} placeholder="Concepto / ángulo" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-400 mb-1.5">Guión</label>
            <textarea value={s.guion ?? ''} onChange={e => setScripts(arr => arr.map(x => x.id === s.id ? { ...x, guion: e.target.value } : x))}
              onBlur={e => updateField(s.id, 'guion', e.target.value)} rows={5} className={`${inputCls} resize-y`} placeholder="Texto del guión / locución / escenas" />
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-400 mb-1.5">Referencias</label>
            <textarea value={s.referencias ?? ''} onChange={e => setScripts(arr => arr.map(x => x.id === s.id ? { ...x, referencias: e.target.value } : x))}
              onBlur={e => updateField(s.id, 'referencias', e.target.value)} rows={2} className={`${inputCls} resize-y`} placeholder="Links o descripción de referencias" />
          </div>
        </div>
      ))}

      <button onClick={addScript}
        className="w-full border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl py-3 text-sm font-medium transition-colors">
        + Agregar guión (TF {scripts.length + 1})
      </button>

      {/* Subir creativos */}
      <div className="pt-4 flex flex-col items-center gap-2">
        {creativos && !editingCreativos && (
          <a href={creativos} target="_blank" rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
            📁 Subir creativos
          </a>
        )}
        {editingCreativos ? (
          <div className="w-full max-w-lg flex gap-2">
            <input value={creativos} onChange={e => setCreativos(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." className={inputCls} />
            <button onClick={saveCreativos} disabled={savingCreativos}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0">Guardar</button>
          </div>
        ) : (
          <button onClick={() => setEditingCreativos(true)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {creativos ? 'Editar carpeta de creativos' : '+ Agregar carpeta de creativos'}
          </button>
        )}
      </div>
    </div>
  )
}
