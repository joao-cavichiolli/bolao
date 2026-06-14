'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function sync() {
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/games/sync', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setMsg(`✅ ${data.synced} jogos sincronizados`)
      router.refresh()
    } else {
      setMsg('❌ Erro ao sincronizar')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={sync}
        disabled={loading}
        className="text-xs bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? '⏳ Atualizando...' : '🔄 Atualizar jogos'}
      </button>
      {msg && <span className="text-xs text-gray-400">{msg}</span>}
    </div>
  )
}
