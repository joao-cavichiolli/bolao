import { sql, migrate } from '@/lib/db'
import Link from 'next/link'
import RankingList from '@/components/RankingList'

export const dynamic = 'force-dynamic'

export interface RankingRow {
  user_name: string
  total_palpites: number
  placar_exato: number
  resultado_certo: number
  erros: number
  total_pontos: number
  premio_euros: number
}

export default async function RankingPage() {
  await migrate()

  const { rows: ranking } = await sql<RankingRow>`
    SELECT
      p.user_name,
      COUNT(*) as total_palpites,
      SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END) as placar_exato,
      SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END) as resultado_certo,
      SUM(CASE WHEN p.points = 0 AND g.status = 'finished' THEN 1 ELSE 0 END) as erros,
      SUM(p.points) as total_pontos,
      SUM(CASE WHEN p.points > 0 THEN g.pot_euros ELSE 0 END) as premio_euros
    FROM palpites p
    JOIN games g ON g.id = p.game_id
    GROUP BY p.user_name
    HAVING SUM(p.points) > 0
    ORDER BY total_pontos DESC, placar_exato DESC, total_palpites DESC
  `

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-yellow-400">🏆 Ranking</h1>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg">Nenhum palpite registrado ainda.</p>
          <Link href="/" className="mt-4 inline-block text-yellow-400 hover:underline">
            Ir para os jogos →
          </Link>
        </div>
      ) : (
        <RankingList initialRanking={ranking} />
      )}

      <div className="text-center">
        <Link href="/" className="text-sm text-green-400 hover:underline">
          ← Voltar para os jogos
        </Link>
      </div>
    </div>
  )
}
