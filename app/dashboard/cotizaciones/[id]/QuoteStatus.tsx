'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const OPTIONS = [
  { key: 'draft', label: 'Borrador' },
  { key: 'sent', label: 'Enviada' },
  { key: 'accepted', label: 'Aceptada' },
  { key: 'rejected', label: 'Rechazada' },
]

export function QuoteStatus({ id, status }: { id: string; status: string }) {
  const supabase = createClient()
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)

  async function change(newStatus: string) {
    setValue(newStatus)
    setSaving(true)
    await supabase.from('quotes').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-3">
      <select value={value} onChange={e => change(e.target.value)} disabled={saving}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500">
        {OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <button onClick={() => window.print()}
        className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
        🖨 PDF
      </button>
    </div>
  )
}
