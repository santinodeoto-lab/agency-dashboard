'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Task = {
  id: string
  title: string
  description: string | null
  type: string
  priority: string
  status: string
  due_date: string | null
  client_id: string | null
  clients: { name: string } | null
}

type Client = { id: string; name: string }

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  normal: 'bg-gray-700 text-gray-300 border-gray-600',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  normal: 'Normal',
}


export default function TareasPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'normal',
    due_date: '',
    client_id: '',
  })

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, clients(name)')
      .neq('status', 'done')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  async function loadClients() {
    const { data } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name')
    setClients(data ?? [])
  }

  useEffect(() => {
    loadTasks()
    loadClients()
  }, [])

  async function handleComplete(task: Task) {
    setUpdating(task.id)
    await fetch(`/api/tareas/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })
    await loadTasks()
    setUpdating(null)
  }

  async function handleDelete(id: string) {
    setUpdating(id)
    await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
    await loadTasks()
    setUpdating(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        type: form.type,
        priority: form.priority,
        due_date: form.due_date || null,
        client_id: form.client_id || null,
        status: 'pending',
      }),
    })
    setForm({ title: '', description: '', type: 'task', priority: 'normal', due_date: '', client_id: '' })
    setShowForm(false)
    await loadTasks()
  }

  const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2 }
  const filtered = tasks
    .filter(t => !filtroCliente || t.client_id === filtroCliente)
    .filter(t => !filtroPrioridad || t.priority === filtroPrioridad)
    .filter(t => !filtroTipo || t.type === filtroTipo)
    .sort((a, b) => (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 2) - (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 2))

  const urgentes = filtered.filter(t => t.priority === 'urgent').length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link prefetch={false} href="/dashboard" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Panel Admin</Link>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold">Tareas</h1>
              {urgentes > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{urgentes} urgente{urgentes > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {showForm ? 'Cancelar' : '+ Nueva tarea'}
          </button>
        </div>

        {/* Formulario nueva tarea */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-300">Nueva tarea</h2>
            <div>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="Título de la tarea *"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="task">Tarea</option>
                <option value="learning">Aprendizaje</option>
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              Guardar tarea
            </button>
          </form>
        )}

        {/* Filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todos los clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todos los tipos</option>
            <option value="task">Tareas</option>
            <option value="learning">Aprendizajes</option>
          </select>
          <span className="text-gray-400 text-sm self-center">{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No hay tareas pendientes.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-blue-400 text-sm hover:underline">+ Crear una tarea</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => (
              <div key={task.id}
                className={`bg-gray-900 rounded-xl p-4 flex items-start gap-4 border-l-2 ${
                  task.priority === 'urgent' ? 'border-red-500' : task.priority === 'high' ? 'border-orange-500' : 'border-gray-700'
                }`}>
                <button
                  onClick={() => handleComplete(task)}
                  disabled={updating === task.id}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-600 hover:border-green-500 flex-shrink-0 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{task.title}</p>
                  {task.description && <p className="text-gray-400 text-sm mt-0.5">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.type === 'learning' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Aprendizaje
                      </span>
                    )}
                    {task.clients && (
                      <Link prefetch={false} href={`/dashboard/clientes/${task.client_id}`}
                        className="text-xs text-gray-400 hover:text-blue-400 transition-colors">
                        {task.clients.name}
                      </Link>
                    )}
                    {task.due_date && (
                      <span className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                        Vence {new Date(task.due_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={updating === task.id}
                  className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
