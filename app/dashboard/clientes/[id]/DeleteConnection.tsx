'use client'

export function DeleteConnection({ connectionId }: { connectionId: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm('¿Eliminar esta cuenta de Meta Ads?')) return
        await fetch('/api/meta/delete-connection', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: connectionId }),
        })
        window.location.reload()
      }}
      className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
      title="Eliminar conexión"
    >
      ×
    </button>
  )
}
