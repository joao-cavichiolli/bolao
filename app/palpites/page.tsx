import { sql, migrate } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Game {
  id: number
  home_team: string
  away_team: string
  competition: string
  game_date: string
  home_score: number | null
  away_score: number | null
  status: 'upcoming' | 'finished'
}

interface Palpite {
  id: number
  game_id: number
  user_name: string
  home_score: number
  away_score: number
  points: number
}

export default async function PalpitesPage() {
  await migrate()
  const { rows: games } = await sql<Game>`SELECT * FROM games ORDER BY game_date ASC`
  const { rows: palpites } = await sql<Palpite>`SELECT * FROM palpites ORDER BY user_name ASC`

  const palpitesByGame = palpites.reduce<Record<number, Palpite[]>>((acc, p) => {
    acc[p.game_id] = acc[p.game_id] ?? []
    acc[p.game_id].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-yellow-400">📋 Palpites</h1>
        <p className="text-gray-400 mt-1">Todos os palpites registrados por jogo</p>
      </div>

      {games.map((game) => {
        const lista = palpitesByGame[game.id] ?? []
        const date = new Date(game.game_date)
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

        return (
          <section key={game.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-bold text-white">
                {game.home_team} x {game.away_team}
              </h2>
              <span className="text-xs text-gray-500">{dateStr} · {game.competition}</span>
              {game.status === 'finished' && game.home_score !== null && (
                <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-yellow-400 font-bold">
                  {game.home_score}x{game.away_score}
                </span>
              )}
            </div>

            {lista.length === 0 ? (
              <p className="text-sm text-gray-600 italic">Nenhum palpite registrado</p>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
                {lista.map((p) => {
                  const isExact = game.status === 'finished' && p.home_score === game.home_score && p.away_score === game.away_score
                  const isRight = game.status === 'finished' && !isExact && p.points === 1
                  const isWrong = game.status === 'finished' && p.points === 0

                  return (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-300">{p.user_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">
                          {p.home_score} x {p.away_score}
                        </span>
                        {isExact && <span className="text-xs text-yellow-400">🏆 Placar exato</span>}
                        {isRight && <span className="text-xs text-green-400">✅ Resultado certo</span>}
                        {isWrong && <span className="text-xs text-red-400">❌ Errou</span>}
                        {game.status === 'upcoming' && <span className="text-xs text-gray-500">Em aberto</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      <div className="text-center">
        <Link href="/" className="text-sm text-green-400 hover:underline">
          ← Voltar para os jogos
        </Link>
      </div>
    </div>
  )
}
