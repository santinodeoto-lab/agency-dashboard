'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function EditLinks({ clientId, guionesUrl, creativosUrl }: {
  clientId: string
  guionesUrl: string
  creativosUrl: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [guiones, setGuiones] = useState(guionesUrl)
  const [creativos, setCreativos] = useState(creativosUrl)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('clients').update({
      guiones_url: guiones || null,
      creativos_url: creativos || null,
    }).eq('id', clientId)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        {open ? 'Cerrar' : 'Editar links'}
      </button>
      {open && (
        <div className="absolute right-6 top-24 w-96 bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4 z-50 shadow-xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Link de guiones (Google Sheets)</label>
            <input value={guiones} onChange={e => setGuiones(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Link de creativos (carpeta de Drive)</label>
            <input value={creativos} onChange={e => setCreativos(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <button onClick={save} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}
    </>
  )
}
