import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteConnection } from './DeleteConnection'

const OBJ_COLORS: Record<string, string> = {
  sales:    'bg-blue-500/20 text-blue-400',
  leads:    'bg-purple-500/20 text-purple-400',
  whatsapp: 'bg-green-500/20 text-green-400',
  branding: 'bg-orange-500/20 text-orange-400',
}
const OBJ_LABELS: Record<string, string> = {
  sales: 'Ventas', leads: 'Leads', whatsapp: 'WhatsApp', branding: 'Branding',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  inactive: 'bg-red-500/20 text-red-400',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', paused: 'Pausado', inactive: 'Inactivo',
}

const MODULES = [
  { label: 'Métricas', desc: 'Resultados de campañas', href: (id: string) => `/dashboard/clientes/${id}/metricas`, icon: '📊' },
  { label: 'Calculadora', desc: 'Presupuestos y proyecciones', href: (id: string) => `/dashboard/clientes/${id}/calculadora`, icon: '🧮' },
  { label: 'Investigación', desc: 'Mercado y competencia', href: (id: string) => `/dashboard/clientes/${id}/investigacion`, icon: '🔍' },
  { label: 'Tareas', desc: 'Pendientes del cliente', href: (id: string) => `/dashboard/tareas?cliente=${id}`, icon: '✓' },
]

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clients')
    .select('*, campaign_objective_types(key, label)')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  const [{ data: logs }, { data: notas }, { data: metaConnections }] = await Promise.all([
    supabase.from('client_log_entries').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('client_notes').select('*').eq('client_id', id).order('updated_at', { ascending: false }),
    supabase.from('ad_platform_connections').select('id, account_name, account_id, status, token_expires_at').eq('client_id', id).eq('platform', 'meta'),
  ])

  // Objectives: prefer new multi-select array, fall back to old FK
  const objectives: string[] = (cliente.objectives && cliente.objectives.length > 0)
    ? cliente.objectives
    : (cliente.campaign_objective_types?.key ? [cliente.campaign_objective_types.key] : [])

  return (
    <div className="p-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {cliente.logo_url ? (
            <img src={cliente.logo_url} alt={cliente.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {cliente.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{cliente.name}</h1>
            {cliente.company_name && (
              <p className="text-gray-400 text-sm mt-0.5">{cliente.company_name}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[cliente.status] ?? ''}`}>
                {STATUS_LABELS[cliente.status] ?? cliente.status}
              </span>
              {objectives.map(key => (
                <span key={key} className={`text-xs px-2.5 py-1 rounded-full font-medium ${OBJ_COLORS[key] ?? 'bg-gray-700 text-gray-300'}`}>
                  {OBJ_LABELS[key] ?? key}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/clientes/${id}/editar`}
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0">
          Editar
        </Link>
      </div>

      {/* ── Módulos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {MODULES.map(mod => (
          <Link key={mod.label} href={mod.href(id)}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors group">
            <div className="text-2xl mb-2">{mod.icon}</div>
            <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{mod.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Cuerpo ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Col izquierda: Ficha + Meta Ads */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ficha</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Fee mensual</p>
                <p className="text-lg font-bold">{cliente.fee_currency} {Number(cliente.fee_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Condición</p>
                <p className="text-sm">{cliente.payment_condition === 'advance' ? 'Pago adelantado' : 'Mes vencido'} · Día {cliente.payment_due_day}</p>
              </div>
              {cliente.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm">{cliente.email}</p>
                </div>
              )}
              {cliente.phone && (
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm">{cliente.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Meta Ads */}
          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Meta Ads</h2>
            {metaConnections && metaConnections.length > 0 ? (
              <div className="space-y-2 mb-3">
                {metaConnections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{conn.account_name}</p>
                      <p className="text-xs text-gray-500">act_{conn.account_id}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${conn.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {conn.status === 'active' ? '●' : '●'}
                      </span>
                      <DeleteConnection connectionId={conn.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-3">Sin cuentas conectadas</p>
            )}
            <a href={`/api/meta/connect?client_id=${id}`}
              className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
              {metaConnections && metaConnections.length > 0 ? '+ Agregar cuenta' : 'Conectar Meta Ads'}
            </a>
          </div>
        </div>

        {/* Col derecha: Bitácora + Notas */}
        <div className="md:col-span-2 space-y-5">

          {/* Bitácora */}
          <div className="bg-gray-900 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Bitácora</h2>
            <LogForm clientId={id} />
            <div className="mt-4 space-y-3">
              {logs && logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="border-l-2 border-gray-700 pl-3">
                  <p className="text-sm text-gray-200">{log.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )) : (
                <p className="text-gray-500 text-sm">Sin entradas todavía.</p>
              )}
            </div>
          </div>

          {/* Notas */}
          {notas && notas.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Notas</h2>
              <div className="space-y-3">
                {notas.map(nota => (
                  <div key={nota.id} className="bg-gray-800 rounded-lg p-3">
                    {nota.title && <p className="text-sm font-medium mb-1">{nota.title}</p>}
                    <p className="text-sm text-gray-300">{nota.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LogForm({ clientId }: { clientId: string }) {
  return (
    <form action={`/api/clientes/${clientId}/log`} method="POST" className="flex gap-2">
      <input
        name="content"
        placeholder="Agregar entrada..."
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <button type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        +
      </button>
    </form>
  )
}
