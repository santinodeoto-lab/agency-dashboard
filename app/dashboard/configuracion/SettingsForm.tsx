'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  agency_name: string | null
  avatar_url: string | null
  email: string
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [agencyName, setAgencyName] = useState(profile.agency_name ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    let avatar_url = profile.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`
      const { data, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (!uploadErr && data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
        avatar_url = `${urlData.publicUrl}?t=${Date.now()}`
      }
      // If bucket doesn't exist yet, skip avatar and continue saving other fields
    }

    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, agency_name: agencyName, avatar_url }),
    })

    setSaving(false)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg({ type: 'err', text: json.error ?? 'Error al guardar. Intentá de nuevo.' })
    } else if (json.warning) {
      setMsg({ type: 'ok', text: json.warning })
      router.refresh()
    } else {
      setMsg({ type: 'ok', text: 'Perfil actualizado correctamente.' })
      router.refresh()
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'err', text: 'Las contraseñas no coinciden.' })
      return
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: 'err', text: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }
    setSavingPwd(true)
    setPwdMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPwd(false)
    if (error) setPwdMsg({ type: 'err', text: error.message })
    else {
      setPwdMsg({ type: 'ok', text: 'Contraseña actualizada.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Perfil & Agencia */}
      <form onSubmit={handleSaveProfile} className="bg-gray-900 rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-gray-200">Perfil y agencia</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer flex-shrink-0 border-2 border-gray-700 hover:border-blue-500 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {(fullName || profile.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Subir foto de perfil
            </button>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 2 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Nombre</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Nombre de la agencia</label>
          <input value={agencyName} onChange={e => setAgencyName(e.target.value)}
            placeholder="Ej: Garage Agency"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          <p className="text-xs text-gray-500 mt-1">Aparece en la parte superior del sidebar.</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input value={profile.email} disabled
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed" />
        </div>

        {msg && (
          <p className={`text-sm ${msg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
        )}

        <button type="submit" disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={handleChangePassword} className="bg-gray-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-200">Cambiar contraseña</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Confirmar contraseña</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repetí la nueva contraseña"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        {pwdMsg && (
          <p className={`text-sm ${pwdMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg.text}</p>
        )}

        <button type="submit" disabled={savingPwd || !newPassword}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          {savingPwd ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  )
}
