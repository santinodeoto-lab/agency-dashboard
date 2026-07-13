'use client'

import { useEffect, useRef, useState } from 'react'
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
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  normal: 'bg-gray-700/50 text-gray-400 border-gray-600/50',
}
const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgente', high: 'Alta', normal: 'Normal' }

const COLUMNS = [
  { id: 'pending',     label: 'Por hacer',   dot: 'bg-gray-400',  border: 'border-gray-600',  count_color: 'text-gray-400' },
  { id: 'in_progress', label: 'En progreso', dot: 'bg-blue-500',  border: 'border-blue-500/60', count_color: 'text-blue-400' },
  { id: 'done',        label: 'Listo',       dot: 'bg-green-500', border: 'border-green-500/60', count_color: 'text-green-400' },
]

const NEXT_STATUS: Record<string, string> = { pending: 'in_progress', in_progress: 'done' }
const PREV_STATUS: Record<string, string> = { in_progress: 'pending', done: 'in_progress' }
const NEXT_LABEL: Record<string, string> = { pending: 'En progreso →', in_progress: 'Listo →' }
const PREV_LABEL: Record<string, string> = { in_progress: '← Por hacer', done: '← En progreso' }

export default function TareasPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const editCardRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    title: '', description: '', type: 'task', priority: 'normal', due_date: '', client_id: '', status: 'pending',
  })

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, clients(name)')
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
    const p = new URLSearchParams(window.location.search)
    if (p.get('cliente')) setFiltroCliente(p.get('cliente')!)
  }, [])

  async function moveTask(id: string, newStatus: string) {
    setMoving(id)
    await fetch(`/api/tareas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await loadTasks()
    setMoving(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    setMoving(id)
    await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
    await loadTasks()
    setMoving(null)
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setForm({
      title: task.title, description: task.description ?? '', type: task.type,
      priority: task.priority, due_date: task.due_date ?? '', client_id: task.client_id ?? '', status: task.status,
    })
    setTimeout(() => editCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ title: '', description: '', type: 'task', priority: 'normal', due_date: '', client_id: '', status: 'pending' })
  }

  async function saveEdit(id: string) {
    setMoving(id)
    await fetch(`/api/tareas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, description: form.description || null, type: form.type,
        priority: form.priority, due_date: form.due_date || null, client_id: form.client_id || null,
      }),
    })
    setEditingId(null)
    await loadTasks()
    setMoving(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, description: form.description || null, type: form.type,
        priority: form.priority, due_date: form.due_date || null, client_id: form.client_id || null, status: 'pending',
      }),
    })
    setForm({ title: '', description: '', type: 'task', priority: 'normal', due_date: '', client_id: '', status: 'pending' })
    setShowForm(false)
    await loadTasks()
  }

  const today = new Date().toISOString().slice(0, 10)

  const filtered = tasks
    .filter(t => !filtroCliente || t.client_id === filtroCliente)
    .filter(t => !filtroPrioridad || t.priority === filtroPrioridad)

  const byStatus = (status: string) => filtered.filter(t => t.status === status)
  const total = filtered.length
  const doneCount = filtered.filter(t => t.status === 'done').length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const inputCls = 'bg-[#0d0d14] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors'

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="px-6 py-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard" className="text-gray-600 text-xs hover:text-gray-400 transition-colors">← Panel Admin</Link>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-xl font-bold">Tareas</h1>
              {total > 0 && (
                <span className="text-gray-500 text-sm">{total} tareas · {pct}% completado</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className={`${inputCls} text-xs`}>
              <option value="">Todos los clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className={`${inputCls} text-xs`}>
              <option value="">Todas las prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
            </select>
            <button
              onClick={() => { cancelEdit(); setShowForm(s => !s) }}
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span> Nueva tarea
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-6">
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-600">{doneCount}/{total} listas</span>
            </div>
          </div>
        )}

        {/* Nueva tarea form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-5 mb-6 space-y-3">
            <p className="text-sm font-semibold text-gray-300">Nueva tarea</p>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              placeholder="Título *" className={`w-full ${inputCls}`} autoFocus />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción (opcional)" rows={2} className={`w-full ${inputCls} resize-none`} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls}>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls}>
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                <option value="task">Tarea</option>
                <option value="learning">Aprendizaje</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">Cancelar</button>
            </div>
          </form>
        )}

        {/* Kanban */}
        {loading ? (
          <p className="text-gray-500 text-center py-20 text-sm">Cargando...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colTasks = byStatus(col.id)
              return (
                <div key={col.id} className="flex flex-col min-h-[400px]">
                  {/* Column header */}
                  <div className={`flex items-center gap-2 px-1 mb-3 pb-3 border-b-2 ${col.border}`}>
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-gray-300">{col.label}</span>
                    <span className={`text-xs font-bold ml-auto ${col.count_color}`}>{colTasks.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3 flex-1">
                    {colTasks.length === 0 && (
                      <div className="border border-dashed border-white/[0.06] rounded-xl h-20 flex items-center justify-center">
                        <p className="text-xs text-gray-700">Arrastrá una tarea aquí</p>
                      </div>
                    )}
                    {colTasks.map(task => {
                      const isEditing = editingId === task.id
                      const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'

                      return (
                        <div
                          key={task.id}
                          ref={isEditing ? editCardRef : undefined}
                          className={`bg-[#0d0d14] border rounded-xl overflow-hidden transition-all ${
                            isEditing ? 'border-blue-500/40' : 'border-white/[0.07] hover:border-white/[0.14]'
                          } ${moving === task.id ? 'opacity-50' : ''}`}
                        >
                          {isEditing ? (
                            <div className="p-3 space-y-2">
                              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className={`w-full ${inputCls} text-sm font-medium`} autoFocus />
                              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2} placeholder="Descripción" className={`w-full ${inputCls} resize-none text-xs`} />
                              <div className="grid grid-cols-2 gap-1.5">
                                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={`${inputCls} text-xs`}>
                                  <option value="normal">Normal</option>
                                  <option value="high">Alta</option>
                                  <option value="urgent">Urgente</option>
                                </select>
                                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={`${inputCls} text-xs`} />
                                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={`${inputCls} text-xs col-span-2`}>
                                  <option value="">Sin cliente</option>
                                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                              <div className="flex gap-1.5 pt-0.5">
                                <button onClick={() => saveEdit(task.id)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">Guardar</button>
                                <button onClick={cancelEdit} className="flex-1 text-gray-500 hover:text-gray-300 text-xs py-1.5 rounded-lg border border-white/[0.07] transition-colors">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-3">
                                {/* Priority + delete */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  {task.priority !== 'normal' ? (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                                      {PRIORITY_LABELS[task.priority]}
                                    </span>
                                  ) : <span />}
                                  <button onClick={() => handleDelete(task.id)} className="text-gray-700 hover:text-red-400 transition-colors text-base leading-none -mt-0.5">×</button>
                                </div>

                                {/* Title + description */}
                                <button onClick={() => startEdit(task)} className="w-full text-left group">
                                  <p className="text-sm font-semibold text-gray-100 group-hover:text-blue-300 transition-colors leading-snug">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                                  )}
                                </button>

                                {/* Meta */}
                                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                  {task.due_date && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isOverdue ? 'bg-red-500/15 text-red-400' : 'bg-white/[0.05] text-gray-500'}`}>
                                      {isOverdue ? '⚠ ' : ''}
                                      {new Date(task.due_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                      {isOverdue ? ' · vencida' : ''}
                                    </span>
                                  )}
                                  {task.clients && (
                                    <Link href={`/dashboard/clientes/${task.client_id}`}
                                      onClick={e => e.stopPropagation()}
                                      className="text-[10px] text-gray-600 hover:text-blue-400 transition-colors truncate max-w-[90px]">
                                      {task.clients.name}
                                    </Link>
                                  )}
                                </div>
                              </div>

                              {/* Move buttons */}
                              <div className={`border-t border-white/[0.05] flex ${PREV_STATUS[col.id] && NEXT_STATUS[col.id] ? 'divide-x divide-white/[0.05]' : ''}`}>
                                {PREV_STATUS[col.id] && (
                                  <button
                                    onClick={() => moveTask(task.id, PREV_STATUS[col.id])}
                                    disabled={moving === task.id}
                                    className="flex-1 text-[10px] text-gray-600 hover:text-gray-300 hover:bg-white/[0.03] py-2 transition-colors text-left px-3"
                                  >
                                    {PREV_LABEL[col.id]}
                                  </button>
                                )}
                                {NEXT_STATUS[col.id] && (
                                  <button
                                    onClick={() => moveTask(task.id, NEXT_STATUS[col.id])}
                                    disabled={moving === task.id}
                                    className="flex-1 text-[10px] text-gray-600 hover:text-gray-300 hover:bg-white/[0.03] py-2 transition-colors text-right px-3"
                                  >
                                    {NEXT_LABEL[col.id]}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
