'use client'
import { useState } from 'react'

interface Game {
  id: number
  home_team: string
  away_team: string
  home_flag?: string
  away_flag?: string
  competition: string
  game_date: string
  home_score: number | null
  away_score: number | null
  status: 'upcoming' | 'finished' | 'live'
}

interface Palpite {
  id: number
  game_id: number
  user_name: string
  home_score: number
  away_score: number
}

interface Props {
  game: Game
  initialPalpites: Palpite[]
}

export default function GameCard({ game, initialPalpites }: Props) {
  const [palpites, setPalpites] = useState(initialPalpites)
  const [userName, setUserName] = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPalpites, setShowPalpites] = useState(false)

  const date = new Date(game.game_date)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!userName.trim()) { setError('Digite seu nome'); return }
    if (homeScore === '' || awayScore === '') { setError('Digite o placar'); return }

    setLoading(true)
    const res = await fetch('/api/palpites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: game.id, user_name: userName, home_score: homeScore, away_score: awayScore }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }

    setSuccess('Palpite salvo! ✅')
    setPalpites((prev) => {
      const idx = prev.findIndex((p) => p.user_name === userName.trim())
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = data
        return updated
      }
      return [...prev, data]
    })
    setHomeScore('')
    setAwayScore('')
  }

  const statusColor = {
    upcoming: 'bg-blue-600',
    finished: 'bg-gray-600',
    live: 'bg-red-600 animate-pulse',
  }[game.status]

  const statusLabel = { upcoming: 'Em breve', finished: 'Encerrado', live: 'AO VIVO' }[game.status]

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-green-900/40 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-green-300 font-medium">{game.competition}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* Teams + Score */}
      <div className="px-4 py-5 flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-1 flex-1">
          {game.home_flag && <img src={game.home_flag} alt={game.home_team} className="w-10 h-10 object-contain" />}
          <span className="text-sm font-bold text-center">{game.home_team}</span>
        </div>

        <div className="flex flex-col items-center">
          {game.status === 'finished' ? (
            <div className="text-3xl font-black text-yellow-400">
              {game.home_score} <span className="text-gray-500 text-xl">x</span> {game.away_score}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-black text-gray-500">vs</div>
              <div className="text-xs text-gray-400 mt-1">{dateStr}</div>
              <div className="text-xs text-gray-400">{timeStr}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 flex-1">
          {game.away_flag && <img src={game.away_flag} alt={game.away_team} className="w-10 h-10 object-contain" />}
          <span className="text-sm font-bold text-center">{game.away_team}</span>
        </div>
      </div>

      {/* Palpite form */}
      {game.status === 'upcoming' && (
        <form onSubmit={submit} className="border-t border-gray-800 px-4 py-4 space-y-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Seu palpite</p>
          <input
            type="text"
            placeholder="Seu nome"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            maxLength={40}
          />
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0"
              min={0}
              max={99}
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <span className="text-gray-500 font-bold">x</span>
            <input
              type="number"
              placeholder="0"
              min={0}
              max={99}
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Registrar palpite'}
          </button>
        </form>
      )}

      {/* Palpites list toggle */}
      {palpites.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-3">
          <button
            onClick={() => setShowPalpites((v) => !v)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showPalpites ? '▲' : '▼'} {palpites.length} palpite{palpites.length !== 1 ? 's' : ''}
          </button>
          {showPalpites && (
            <ul className="mt-2 space-y-1">
              {palpites.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{p.user_name}</span>
                  <span className="font-mono text-yellow-300">
                    {p.home_score} x {p.away_score}
                    {game.status === 'finished' && (
                      <span className="ml-2 text-xs text-gray-400">
                        {p.home_score === game.home_score && p.away_score === game.away_score
                          ? '🏆 +3'
                          : Math.sign(p.home_score - p.away_score) === Math.sign((game.home_score ?? 0) - (game.away_score ?? 0))
                          ? '✅ +1'
                          : '❌ +0'}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
