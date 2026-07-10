'use client'

import { useState } from 'react'

export function ShareGuionesButton({ shareToken }: { shareToken: string | null }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!shareToken) return null

  const url = `${window.location.origin}/share/${shareToken}/guiones`

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        <span>📤</span> Compartir guiones
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-30 p-4">
          <p className="text-sm font-semibold text-white mb-1">Link para el cliente</p>
          <p className="text-xs text-gray-400 mb-3">Solo verán los guiones pendientes. No se necesita cuenta.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none truncate"
            />
            <button
              onClick={copy}
              className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-center text-xs text-gray-500 hover:text-blue-400 transition-colors"
          >
            Abrir vista previa →
          </a>
        </div>
      )}
    </div>
  )
}
