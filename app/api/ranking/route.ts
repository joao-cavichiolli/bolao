import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const ranking = db.prepare(`
    SELECT
      user_name,
      COUNT(*) as total_palpites,
      SUM(CASE WHEN points = 3 THEN 1 ELSE 0 END) as placar_exato,
      SUM(CASE WHEN points = 1 THEN 1 ELSE 0 END) as resultado_certo,
      SUM(CASE WHEN points = 0 AND g.status = 'finished' THEN 1 ELSE 0 END) as erros,
      SUM(p.points) as total_pontos
    FROM palpites p
    JOIN games g ON g.id = p.game_id
    GROUP BY user_name
    ORDER BY total_pontos DESC, placar_exato DESC, total_palpites DESC
  `).all()

  return Response.json(ranking)
}
