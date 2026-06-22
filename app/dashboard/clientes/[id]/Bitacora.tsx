'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type LogEntry = { id: string; content: string; created_at: string }

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Bitacora({ clientId, initialLogs }: { clientId: string; initialLogs: LogEntry[] }) {
  const supabase = createClient()
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [nuevo, setNuevo] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevo.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('client_log_entries')
      .insert({ client_id: clientId, content: nuevo.trim() })
      .select('id, content, created_at')
      .single()
    setSaving(false)
    if (data) {
      setLogs(l => [data as LogEntry, ...l])
      setNuevo('')
    }
  }

  function startEdit(log: LogEntry) {
    setEditingId(log.id)
    setEditText(log.content)
  }

  async function saveEdit(id: string) {
    const text = editText.trim()
    if (!text) return
    await supabase.from('client_log_entries').update({ content: text }).eq('id', id)
    setLogs(l => l.map(x => x.id === id ? { ...x, content: text } : x))
    setEditingId(null)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta entrada de la bitácora?')) return
    await supabase.from('client_log_entries').delete().eq('id', id)
    setLogs(l => l.filter(x => x.id !== id))
  }

  return (
    <div>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          placeholder="Agregar entrada..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          +
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin entradas todavía.</p>
        ) : logs.map(log => (
          <div key={log.id} className="border-l-2 border-gray-700 pl-3 group">
            {editingId === log.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(log.id)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors">Guardar</button>
                  <button onClick={() => setEditingId(null)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{log.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{fmt(log.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(log)} title="Editar"
                    className="text-gray-600 hover:text-blue-400 transition-colors text-sm">✎</button>
                  <button onClick={() => remove(log.id)} title="Eliminar"
                    className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
