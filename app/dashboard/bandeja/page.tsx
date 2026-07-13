'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Task = {
  id: string
  title: string
  description: string | null
  due_date: string
  priority: string
  client_id: string | null
  clients: { name: string } | null
}

const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgente', high: 'Alta', normal: 'Normal' }

export default function BandejaPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      const limit = new Date()
      limit.setDate(limit.getDate() + 2)
      const { data } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, client_id, clients(name)')
        .neq('status', 'done')
        .not('due_date', 'is', null)
        .lte('due_date', limit.toISOString().slice(0, 10))
        .order('due_date', { ascending: true })
      setTasks((data as unknown as Task[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function urgencyLabel(due: string) {
    if (due < today) return { text: 'Vencida', bg: 'bg-red-500/20 text-red-400 border-red-500/30', border: 'border-red-500' }
    if (due === today) return { text: 'Hoy', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', border: 'border-yellow-500' }
    return { text: 'Pronto', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', border: 'border-blue-500' }
  }

  const vencidas = tasks.filter(t => t.due_date < today)
  const hoy = tasks.filter(t => t.due_date === today)
  const pronto = tasks.filter(t => t.due_date > today)

  function TaskRow({ task }: { task: Task }) {
    const u = urgencyLabel(task.due_date)
    return (
      <button
        onClick={() => router.push(`/dashboard/tareas${task.client_id ? `?cliente=${task.client_id}` : ''}`)}
        className={`w-full text-left bg-gray-900 rounded-xl p-4 border-l-4 ${u.border} hover:bg-gray-800 transition-colors`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-white">{task.title}</p>
            {task.description && <p className="text-gray-400 text-sm mt-0.5 line-clamp-1">{task.description}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${u.bg}`}>{u.text}</span>
              <span className="text-xs text-gray-500">
                {new Date(task.due_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
              {task.priority !== 'normal' && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              )}
              {task.clients && <span className="text-xs text-gray-400">{task.clients.name}</span>}
            </div>
          </div>
          <span className="text-gray-600 text-lg flex-shrink-0">→</span>
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Panel Admin</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold">Bandeja de entrada</h1>
            {tasks.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Tareas vencidas o por vencer en los próximos 2 días</p>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <p className="text-3xl mb-3">✓</p>
            <p className="text-gray-300 font-medium">Estás al día</p>
            <p className="text-gray-500 text-sm mt-1">No hay tareas urgentes ni por vencer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {vencidas.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Vencidas · {vencidas.length}</h2>
                <div className="space-y-2">{vencidas.map(t => <TaskRow key={t.id} task={t} />)}</div>
              </section>
            )}
            {hoy.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">Hoy · {hoy.length}</h2>
                <div className="space-y-2">{hoy.map(t => <TaskRow key={t.id} task={t} />)}</div>
              </section>
            )}
            {pronto.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Próximamente · {pronto.length}</h2>
                <div className="space-y-2">{pronto.map(t => <TaskRow key={t.id} task={t} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
