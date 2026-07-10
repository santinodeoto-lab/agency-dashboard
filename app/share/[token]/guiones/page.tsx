import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const FORMATO_COLORS: Record<string, string> = {
  'Video 30 seg máximo': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Video 40 seg máximo': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Carrusel': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Placa': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

export default async function PublicGuionesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: cliente } = await admin
    .from('clients')
    .select('id, name, creativos_url')
    .eq('share_token', token)
    .single()

  if (!cliente) notFound()

  const { data: scripts } = await admin
    .from('client_scripts')
    .select('id, position, formato, idea, guion, referencias, uploaded')
    .eq('client_id', cliente.id)
    .order('position', { ascending: true })

  const list = scripts ?? []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-0.5">SO Paid Media</p>
            <h1 className="text-lg font-semibold text-white">{cliente.name} — Guiones</h1>
          </div>
          {cliente.creativos_url && (
            <a
              href={cliente.creativos_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Subir creativos
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {list.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Todavía no hay guiones disponibles.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-gray-500 text-sm mb-6">
              {list.length} {list.length === 1 ? 'pieza' : 'piezas'} para producir este mes
            </p>
            {list.map((s, i) => {
              const formatoColor = s.formato ? (FORMATO_COLORS[s.formato] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30') : null
              return (
                <div key={s.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 bg-white/[0.06] rounded-md px-2 py-0.5 tracking-widest uppercase">
                        TF {i + 1}
                      </span>
                      {s.formato && formatoColor && (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${formatoColor}`}>
                          {s.formato}
                        </span>
                      )}
                    </div>
                    {s.uploaded && (
                      <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-0.5 font-medium">
                        ✓ Subido al Drive
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Idea */}
                    {s.idea && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Idea del anuncio</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{s.idea}</p>
                      </div>
                    )}

                    {/* Guión */}
                    {s.guion && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Guión</p>
                        <div className="bg-[#0a0a0f] rounded-xl border border-white/[0.06] p-4">
                          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">{s.guion}</p>
                        </div>
                      </div>
                    )}

                    {/* Referencias */}
                    {s.referencias && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Referencias</p>
                        <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{s.referencias}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-[11px] text-gray-700">SO Paid Media · Guiones de contenido</p>
        </div>
      </div>
    </div>
  )
}
