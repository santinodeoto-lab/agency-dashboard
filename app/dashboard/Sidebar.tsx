'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface Client {
  id: string
  name: string
  logo_url?: string | null
}

interface Props {
  clients: Client[]
  agencyName?: string | null
  avatarUrl?: string | null
}

const NAV = [
  { label: 'Finanzas', href: '/dashboard/finanzas' },
  { label: 'Tareas', href: '/dashboard/tareas' },
  { label: 'Pipeline', href: '/dashboard/pipeline' },
  { label: 'Cotizaciones', href: '/dashboard/cotizaciones' },
]

export function Sidebar({ clients, agencyName, avatarUrl }: Props) {
  const pathname = usePathname()
  const [clientsOpen, setClientsOpen] = useState(false)

  function isClientActive(id: string) {
    return pathname.startsWith(`/dashboard/clientes/${id}`)
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-gray-900 border-r border-gray-800 flex flex-col z-20">
      {/* Logo / Inicio */}
      <div className="px-4 py-5 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          {avatarUrl ? (
            <img src={avatarUrl} alt="logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(agencyName ?? 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
            {agencyName ?? 'Mi Agencia'}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* Clientes — cerrado por defecto */}
        <button
          onClick={() => setClientsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Clientes
          <span className="text-gray-600">{clientsOpen ? '▾' : '▸'}</span>
        </button>

        {clientsOpen && (
          <div className="space-y-0.5">
            {clients.map((client) => {
              const active = isClientActive(client.id)
              return (
                <Link
                  key={client.id}
                  href={`/dashboard/clientes/${client.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {client.name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate">{client.name}</span>
                </Link>
              )
            })}
            <Link
              href="/dashboard/clientes"
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === '/dashboard/clientes' ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Ver todos los clientes
            </Link>
          </div>
        )}

        <div className="my-2 border-t border-gray-800" />

        <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Operaciones
        </p>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href) ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-gray-800 pt-3">
        <Link
          href="/dashboard/configuracion"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive('/dashboard/configuracion') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <span className="text-base">⚙</span>
          Configuración
        </Link>
        <Link
          prefetch={false}
          href="/logout"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <span className="text-base">→</span>
          Cerrar sesión
        </Link>
      </div>
    </aside>
  )
}
