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

const FORMATOS = ['Video 30 seg máximo', 'Video 40 seg máximo', 'Carrusel', 'Placa']

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

  function setLocal(id: string, field: keyof Script, value: string | boolean) {
    setScripts(s => s.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  async function save(id: string, field: keyof Script, value: string | boolean) {
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

  const cellInput = 'w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500'
  const labelCell = 'sticky left-0 z-10 bg-gray-800 border border-gray-800 px-3 py-2 font-semibold text-gray-300 text-xs uppercase tracking-wider align-top w-40 min-w-40'
  const dataCell = 'border border-gray-800 px-2 py-2 align-top min-w-[300px] w-[300px]'

  if (loading) return <p className="text-gray-400 text-sm">Cargando...</p>

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-900">
        <table className="border-collapse">
          <tbody>
            {/* TF header */}
            <tr>
              <td className={`${labelCell} bg-gray-700 text-white`}>Creativos</td>
              {scripts.map((s, i) => (
                <td key={s.id} className={`${dataCell} bg-gray-700 text-center`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold text-white">TF {i + 1}</span>
                    <button onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-400 transition-colors text-base leading-none">×</button>
                  </div>
                </td>
              ))}
              <td className="border border-gray-800 px-2 py-2 align-middle min-w-[120px]">
                <button onClick={addScript} className="text-blue-400 hover:text-blue-300 text-sm font-medium whitespace-nowrap">+ Agregar TF</button>
              </td>
            </tr>

            {/* Formato */}
            <tr>
              <td className={labelCell}>Formato</td>
              {scripts.map(s => (
                <td key={s.id} className={dataCell}>
                  <select value={s.formato ?? ''} onChange={e => { setLocal(s.id, 'formato', e.target.value); save(s.id, 'formato', e.target.value) }} className={cellInput}>
                    <option value="">— Elegir —</option>
                    {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </td>
              ))}
              <td className="border border-gray-800"></td>
            </tr>

            {/* Idea del anuncio */}
            <tr>
              <td className={labelCell}>Idea del anuncio</td>
              {scripts.map(s => (
                <td key={s.id} className={dataCell}>
                  <textarea value={s.idea ?? ''} rows={2} placeholder="Concepto / ángulo"
                    onChange={e => setLocal(s.id, 'idea', e.target.value)} onBlur={e => save(s.id, 'idea', e.target.value)}
                    className={`${cellInput} resize-y`} />
                </td>
              ))}
              <td className="border border-gray-800"></td>
            </tr>

            {/* Guión */}
            <tr>
              <td className={labelCell}>Guión</td>
              {scripts.map(s => (
                <td key={s.id} className={dataCell}>
                  <textarea value={s.guion ?? ''} rows={8} placeholder="Texto del guión, locución, escenas, CTA..."
                    onChange={e => setLocal(s.id, 'guion', e.target.value)} onBlur={e => save(s.id, 'guion', e.target.value)}
                    className={`${cellInput} resize-y`} />
                </td>
              ))}
              <td className="border border-gray-800"></td>
            </tr>

            {/* Referencias */}
            <tr>
              <td className={labelCell}>Referencias</td>
              {scripts.map(s => (
                <td key={s.id} className={dataCell}>
                  <textarea value={s.referencias ?? ''} rows={3} placeholder="Links o descripción de referencias"
                    onChange={e => setLocal(s.id, 'referencias', e.target.value)} onBlur={e => save(s.id, 'referencias', e.target.value)}
                    className={`${cellInput} resize-y`} />
                </td>
              ))}
              <td className="border border-gray-800"></td>
            </tr>

            {/* Estado / Subido */}
            <tr>
              <td className={labelCell}>Estado</td>
              {scripts.map(s => (
                <td key={s.id} className={dataCell}>
                  <select value={s.uploaded ? 'si' : 'no'} onChange={e => { const v = e.target.value === 'si'; setLocal(s.id, 'uploaded', v); save(s.id, 'uploaded', v) }}
                    className={`${cellInput} ${s.uploaded ? 'text-green-400' : 'text-gray-400'}`}>
                    <option value="no">No subido</option>
                    <option value="si">Subido al Drive</option>
                  </select>
                </td>
              ))}
              <td className="border border-gray-800"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {scripts.length === 0 && (
        <p className="text-gray-500 text-sm">Todavía no hay guiones. Tocá <span className="text-blue-400">+ Agregar TF</span> para crear el primero.</p>
      )}

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
            <input value={creativos} onChange={e => setCreativos(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." className={cellInput} />
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
