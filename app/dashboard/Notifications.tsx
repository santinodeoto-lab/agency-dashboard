'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TaskNotif = {
  id: string
  title: string
  due_date: string
  client_id: string | null
  clients: { name: string } | null
}

export function Notifications() {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState<TaskNotif[]>([])
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    // Tareas pendientes con fecha de vencimiento hasta hoy + 2 días
    const limit = new Date()
    limit.setDate(limit.getDate() + 2)
    const { data } = await supabase
      .from('tasks')
      .select('id, title, due_date, client_id, clients(name)')
      .neq('status', 'done')
      .not('due_date', 'is', null)
      .lte('due_date', limit.toISOString().slice(0, 10))
      .order('due_date', { ascending: true })
    setTasks((data as unknown as TaskNotif[]) ?? [])
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // refrescar cada 5 min
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  function label(due: string) {
    if (due < today) return { text: 'Vencida', color: 'text-red-400' }
    if (due === today) return { text: 'Hoy', color: 'text-yellow-400' }
    return { text: 'Pronto', color: 'text-blue-400' }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        title="Recordatorios"
      >
        <span className="text-lg">🔔</span>
        {tasks.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {tasks.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">Recordatorios</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm px-4 py-6 text-center">Sin recordatorios pendientes.</p>
            ) : (
              tasks.map(t => {
                const l = label(t.due_date)
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setOpen(false)
                      router.push(t.client_id ? `/dashboard/tareas?cliente=${t.client_id}` : '/dashboard/tareas')
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-200 truncate">{t.title}</p>
                      <span className={`text-xs font-medium flex-shrink-0 ${l.color}`}>{l.text}</span>
                    </div>
                    {t.clients && <p className="text-xs text-gray-500 mt-0.5">{t.clients.name}</p>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
