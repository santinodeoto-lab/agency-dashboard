import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteConnection } from './DeleteConnection'
import { Bitacora } from './Bitacora'
import { ShareButton } from './ShareButton'

const OBJ_COLORS: Record<string, string> = {
  sales:    'bg-blue-500/20 text-blue-400',
  leads:    'bg-purple-500/20 text-purple-400',
  whatsapp: 'bg-green-500/20 text-green-400',
  branding: 'bg-orange-500/20 text-orange-400',
}
const OBJ_LABELS: Record<string, string> = {
  sales: 'Ventas', leads: 'Leads', whatsapp: 'WhatsApp', branding: 'Branding',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', paused: 'Pausado', inactive: 'Inactivo',
}

const MODULES = [
  { label: 'Métricas', desc: 'Campañas', href: (id: string) => `/dashboard/clientes/${id}/metricas`, icon: '📊', accent: 'group-hover:border-blue-500/40 group-hover:bg-blue-500/[0.04]' },
  { label: 'Calculadora', desc: 'Presupuestos', href: (id: string) => `/dashboard/clientes/${id}/calculadora`, icon: '🧮', accent: 'group-hover:border-violet-500/40 group-hover:bg-violet-500/[0.04]' },
  { label: 'Investigación', desc: 'Mercado', href: (id: string) => `/dashboard/clientes/${id}/investigacion`, icon: '🔍', accent: 'group-hover:border-amber-500/40 group-hover:bg-amber-500/[0.04]' },
  { label: 'Guiones', desc: 'Creativos', href: (id: string) => `/dashboard/clientes/${id}/guiones`, icon: '🎬', accent: 'group-hover:border-rose-500/40 group-hover:bg-rose-500/[0.04]' },
  { label: 'Reportes', desc: 'Informes', href: (id: string) => `/dashboard/clientes/${id}/reportes`, icon: '📋', accent: 'group-hover:border-teal-500/40 group-hover:bg-teal-500/[0.04]' },
  { label: 'Tareas', desc: 'Pendientes', href: (id: string) => `/dashboard/tareas?cliente=${id}`, icon: '✓', accent: 'group-hover:border-orange-500/40 group-hover:bg-orange-500/[0.04]' },
]

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente, error: clienteError } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!cliente || clienteError) notFound()

  const [{ data: logs }, { data: notas }, metaResult] = await Promise.all([
    supabase.from('client_log_entries').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('client_notes').select('*').eq('client_id', id).order('updated_at', { ascending: false }),
    supabase.from('ad_platform_connections').select('id, account_name, account_id, status, token_expires_at').eq('client_id', id).eq('platform', 'meta'),
  ])
  // Fall back to without token_expires_at if column doesn't exist yet
  const metaConnections = metaResult.error?.message?.includes('token_expires_at')
    ? (await supabase.from('ad_platform_connections').select('id, account_name, account_id, status').eq('client_id', id).eq('platform', 'meta')).data
    : metaResult.data

  // Objectives: prefer new multi-select array, fall back to old FK
  const objectives: string[] = (cliente.objectives && cliente.objectives.length > 0)
    ? cliente.objectives
    : (cliente.campaign_objective_types?.key ? [cliente.campaign_objective_types.key] : [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div className="flex items-center gap-4">
          {cliente.logo_url ? (
            <img src={cliente.logo_url} alt={cliente.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 ring-1 ring-white/10" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {cliente.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{cliente.name}</h1>
            {cliente.company_name && (
              <p className="text-gray-500 text-sm mt-0.5">{cliente.company_name}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                cliente.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                cliente.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {STATUS_LABELS[cliente.status] ?? cliente.status}
              </span>
              {objectives.map(key => (
                <span key={key} className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${OBJ_COLORS[key] ?? 'bg-gray-700/50 text-gray-300 border-gray-600/50'}`}>
                  {OBJ_LABELS[key] ?? key}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ShareButton shareToken={(cliente as any).share_token ?? null} />
          <Link href={`/dashboard/clientes/${id}/editar`}
            className="bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Editar
          </Link>
        </div>
      </div>

      {/* ── Módulos ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {MODULES.map(mod => (
          <Link key={mod.label} href={mod.href(id)}
            className={`bg-[#0d0d14] border border-white/[0.07] rounded-xl p-3.5 transition-all group ${mod.accent}`}>
            <div className="text-xl mb-2">{mod.icon}</div>
            <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">{mod.label}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{mod.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Cuerpo ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Col izquierda: Ficha + Meta Ads */}
        <div className="space-y-3">

          {/* Ficha */}
          <div className="bg-[#0d0d14] border border-white/[0.07] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Ficha</p>
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-600">Fee mensual</span>
                <span className="text-sm font-bold text-white">{cliente.fee_currency} {Number(cliente.fee_amount).toLocaleString()}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-600">Condición</span>
                <span className="text-xs text-gray-300">{cliente.payment_condition === 'advance' ? 'Adelantado' : 'Mes vencido'} · Día {cliente.payment_due_day}</span>
              </div>
              {cliente.email && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-gray-600 flex-shrink-0">Email</span>
                  <span className="text-xs text-gray-300 truncate">{cliente.email}</span>
                </div>
              )}
              {cliente.phone && (
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-600">Teléfono</span>
                  <span className="text-xs text-gray-300">{cliente.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta Ads */}
          <div className="bg-[#0d0d14] border border-white/[0.07] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Meta Ads</p>
            {metaConnections && metaConnections.length > 0 ? (
              <div className="space-y-2 mb-3">
                {metaConnections.map(conn => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const expiresAt = (conn as any).token_expires_at ? new Date((conn as any).token_expires_at) : null
                  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                  const expiringSoon = daysLeft !== null && daysLeft <= 10
                  const expired = daysLeft !== null && daysLeft <= 0
                  return (
                    <div key={conn.id}>
                      <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2 gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate text-gray-200">{conn.account_name}</p>
                          <p className="text-[10px] text-gray-600">act_{conn.account_id}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${conn.status === 'active' && !expired ? 'bg-green-400' : 'bg-red-400'}`} />
                          <DeleteConnection connectionId={conn.id} />
                        </div>
                      </div>
                      {(expiringSoon || expired) && (
                        <div className={`mt-1 rounded-lg px-3 py-2 flex items-center justify-between gap-2 ${expired ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                          <p className={`text-xs ${expired ? 'text-red-400' : 'text-yellow-400'}`}>
                            {expired ? 'Token vencido' : `Vence en ${daysLeft}d`}
                          </p>
                          <a href={`/api/meta/connect?client_id=${id}`} className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors flex-shrink-0 ${expired ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'}`}>
                            Renovar
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-600 mb-3">Sin cuentas conectadas</p>
            )}
            <a href={`/api/meta/connect?client_id=${id}`}
              className="flex items-center justify-center w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-gray-400 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
              {metaConnections && metaConnections.length > 0 ? '+ Agregar cuenta' : 'Conectar Meta Ads'}
            </a>
          </div>
        </div>

        {/* Col derecha: Bitácora + Notas */}
        <div className="md:col-span-2 space-y-4">

          {/* Bitácora */}
          <div className="bg-[#0d0d14] border border-white/[0.07] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Bitácora</p>
            <Bitacora clientId={id} initialLogs={logs ?? []} />
          </div>

          {/* Notas */}
          {notas && notas.length > 0 && (
            <div className="bg-[#0d0d14] border border-white/[0.07] rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Notas</p>
              <div className="space-y-2">
                {notas.map(nota => (
                  <div key={nota.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                    {nota.title && <p className="text-sm font-medium mb-1 text-gray-200">{nota.title}</p>}
                    <p className="text-sm text-gray-400">{nota.content}</p>
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

