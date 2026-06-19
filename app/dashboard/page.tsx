import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Debug temporal
  if (!user) {
    return (
      <div style={{background:'#000',color:'#fff',padding:'2rem',fontFamily:'monospace'}}>
        <h1>AUTH FALLO en /dashboard</h1>
        <p>Error: {authError?.message ?? 'null'}</p>
        <p>Error status: {authError?.status ?? 'null'}</p>
        <p><a href="/login" style={{color:'#60a5fa'}}>Volver a login</a></p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const { data: clientes } = await supabase
    .from('clients')
    .select('id, status, fee_amount, fee_currency')

  const activos = clientes?.filter(c => c.status === 'active') ?? []
  const totalMensual = activos.reduce((sum, c) => sum + Number(c.fee_amount), 0)

  const { data: tareas } = await supabase
    .from('tasks')
    .select('id')
    .eq('status', 'pending')

  const NAV = [
    { label: 'Clientes', href: '/dashboard/clientes', desc: 'CRM y fichas' },
    { label: 'Finanzas', href: '/dashboard/finanzas', desc: 'Cobros y vencimientos' },
    { label: 'Tareas', href: '/dashboard/tareas', desc: 'Por cliente y globales' },
    { label: 'Pipeline', href: '/dashboard/pipeline', desc: 'Oportunidades comerciales' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Panel Admin</h1>
            <p className="text-gray-400 text-sm mt-0.5">Bienvenido, {profile?.full_name ?? user.email}</p>
          </div>
          <Link href="/logout" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Cerrar sesión
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Clientes activos</p>
            <p className="text-3xl font-bold mt-1">{activos.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Ingresos mensuales</p>
            <p className="text-3xl font-bold mt-1">USD {totalMensual.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Tareas pendientes</p>
            <p className="text-3xl font-bold mt-1">{tareas?.length ?? 0}</p>
          </div>
        </div>

        {/* Navegación */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="bg-gray-900 hover:bg-gray-800 rounded-xl p-5 transition-colors">
              <p className="font-semibold">{item.label}</p>
              <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
