'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function toPreview(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/\/spreadsheets\/d\/([^/]+)/)
  if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/preview`
  return url
}

export function GuionesView({ clientId, clientName, guionesUrl, creativosUrl }: {
  clientId: string
  clientName: string
  guionesUrl: string | null
  creativosUrl: string | null
}) {
  const supabase = createClient()
  const [guiones, setGuiones] = useState(guionesUrl ?? '')
  const [creativos, setCreativos] = useState(creativosUrl ?? '')
  const [editing, setEditing] = useState(!guionesUrl)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('clients').update({
      guiones_url: guiones || null,
      creativos_url: creativos || null,
    }).eq('id', clientId)
    setSaving(false)
    setEditing(false)
  }

  const preview = toPreview(guiones)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <Link href={`/dashboard/clientes/${clientId}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {clientName}</Link>
            <h1 className="text-2xl font-bold mt-1">Guiones · {clientName}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {creativos && (
              <a href={creativos} target="_blank" rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                🎨 Creativos
              </a>
            )}
            {guiones && (
              <a href={guiones} target="_blank" rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Abrir en Drive ↗
              </a>
            )}
            <button onClick={() => setEditing(e => !e)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {editing ? 'Cerrar' : 'Editar links'}
            </button>
          </div>
        </div>

        {editing && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Link de guiones (Google Sheets)</label>
              <input value={guiones} onChange={e => setGuiones(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Link de creativos (carpeta de Drive)</label>
              <input value={creativos} onChange={e => setCreativos(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={save} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}

        {preview ? (
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <iframe src={preview} className="w-full" style={{ height: '75vh' }} title="Guiones" />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-10 text-center">
            <p className="text-gray-400">No hay planilla de guiones cargada para este cliente.</p>
            <button onClick={() => setEditing(true)} className="mt-3 text-blue-400 text-sm hover:underline">+ Agregar link</button>
          </div>
        )}
        <p className="text-xs text-gray-600 mt-3">La planilla se muestra embebida desde tu Google Drive. Si no carga, asegurate de estar logueado en Google en este navegador o abrila en Drive.</p>
      </div>
    </div>
  )
}
