import { sql, migrate } from '@/lib/db'
import GameCard from '@/components/GameCard'
import SyncButton from '@/components/SyncButton'

export const dynamic = 'force-dynamic'

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

export default async function HomePage() {
  await migrate()
  const { rows: games } = await sql<Game>`SELECT * FROM games WHERE competition ILIKE '%world cup%' ORDER BY game_date ASC`
  const { rows: palpites } = await sql<Palpite>`SELECT * FROM palpites`

  const palpitesByGame = palpites.reduce<Record<number, Palpite[]>>((acc, p) => {
    acc[p.game_id] = acc[p.game_id] ?? []
    acc[p.game_id].push(p)
    return acc
  }, {})

  const upcoming = games.filter((g) => g.status === 'upcoming' || g.status === 'live').slice(0, 2)
  const finished = games.filter((g) => g.status === 'finished').slice(-2)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-yellow-400">Copa do Mundo 2026 🏆</h1>
          <p className="text-gray-400 mt-1">Faça seu palpite e dispute o ranking!</p>
        </div>
        <SyncButton />
      </div>

      {games.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-lg">Nenhum jogo carregado ainda.</p>
          <p className="text-sm mt-2">Clique em &ldquo;Atualizar jogos&rdquo; para buscar os jogos do Brasil.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>📅</span> Próximos jogos
          </h2>
          <div className="space-y-4">
            {upcoming.map((game) => (
              <GameCard key={game.id} game={game} initialPalpites={palpitesByGame[game.id] ?? []} />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
            <span>✅</span> Jogos encerrados
          </h2>
          <div className="space-y-4">
            {finished.map((game) => (
              <GameCard key={game.id} game={game} initialPalpites={palpitesByGame[game.id] ?? []} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
