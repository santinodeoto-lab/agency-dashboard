'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebug('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos: ' + error.message)
      setLoading(false)
      return
    }

    // Verificar qué ve el SERVIDOR justo después del login
    const serverCheck = await fetch('/api/debug', { credentials: 'include' })
    const serverData = await serverCheck.json()
    setDebug(
      'Browser cookies: ' + (document.cookie ? document.cookie.substring(0, 60) + '...' : '(ninguna)') +
      ' | Servidor ve: ' + serverData.cookieCount + ' cookies, user=' + (serverData.user?.email ?? 'null')
    )

    // Verificar la sesión
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setError('Login ok pero sesión null.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user!.id)
      .single()

    if (profile?.role === 'admin') {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/portal'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Agency Dashboard</h1>
          <p className="text-gray-400 mt-2">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-gray-900 rounded-xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm break-all">{error}</p>}
          {debug && <p className="text-yellow-400 text-xs break-all bg-gray-800 p-2 rounded">{debug}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-3 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
