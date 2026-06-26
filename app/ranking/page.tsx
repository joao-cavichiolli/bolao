import { sql, migrate } from '@/lib/db'
import Link from 'next/link'
import RankingList from '@/components/RankingList'
import SaldoDevedor from '@/components/SaldoDevedor'

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

interface SaldoRow {
  nome: string
  jogos: number
  devido: number
  ganhou: number
  saldo: number
}

interface AliasRow {
  alias_name: string
  canonical_name: string
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
      SUM(CASE WHEN p.points = 3 THEN g.pot_euros::numeric / w.winner_count ELSE 0 END) as premio_euros
    FROM palpites p
    JOIN games g ON g.id = p.game_id
    JOIN (
      SELECT game_id, COUNT(*) as winner_count
      FROM palpites WHERE points = 3
      GROUP BY game_id
    ) w ON w.game_id = p.game_id
    GROUP BY p.user_name
    HAVING SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END) > 0
    ORDER BY placar_exato DESC, total_pontos DESC
  `

  const { rows: saldo } = await sql<SaldoRow>`
    SELECT
      COALESCE(ua.canonical_name, p.user_name) as nome,
      COUNT(DISTINCT p.game_id) as jogos,
      COUNT(DISTINCT p.game_id) as devido,
      COALESCE(SUM(CASE WHEN p.points = 3 THEN g.pot_euros::numeric / w.winner_count ELSE 0 END), 0) as ganhou,
      COALESCE(SUM(CASE WHEN p.points = 3 THEN g.pot_euros::numeric / w.winner_count ELSE 0 END), 0) - COUNT(DISTINCT p.game_id) as saldo
    FROM palpites p
    JOIN games g ON g.id = p.game_id
    LEFT JOIN user_aliases ua ON ua.alias_name = p.user_name
    LEFT JOIN (
      SELECT game_id, COUNT(*) as winner_count FROM palpites WHERE points = 3 GROUP BY game_id
    ) w ON w.game_id = p.game_id
    GROUP BY COALESCE(ua.canonical_name, p.user_name)
    ORDER BY saldo ASC
  `

  const { rows: aliases } = await sql<AliasRow>`SELECT alias_name, canonical_name FROM user_aliases ORDER BY canonical_name`

  const { rows: namesRows } = await sql<{ user_name: string }>`SELECT DISTINCT user_name FROM palpites ORDER BY user_name`
  const allNames = namesRows.map((r) => r.user_name)

  return (
    <div className="space-y-10">
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

      <SaldoDevedor initialSaldo={saldo} initialAliases={aliases} allNames={allNames} />

      <div className="text-center">
        <Link href="/" className="text-sm text-green-400 hover:underline">
          ← Voltar para os jogos
        </Link>
      </div>
    </div>
  )
}
