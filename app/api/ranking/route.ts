import { sql, migrate } from '@/lib/db'

export async function GET() {
  await migrate()
  const { rows } = await sql`
    SELECT
      p.user_name,
      COUNT(*) as total_palpites,
      SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END) as placar_exato,
      SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END) as resultado_certo,
      SUM(CASE WHEN p.points = 0 AND g.status = 'finished' THEN 1 ELSE 0 END) as erros,
      SUM(p.points) as total_pontos,
      SUM(CASE WHEN p.points = 3 THEN g.pot_euros ELSE 0 END) as premio_euros
    FROM palpites p
    JOIN games g ON g.id = p.game_id
    GROUP BY p.user_name
    HAVING SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END) > 0
    ORDER BY placar_exato DESC, total_pontos DESC
  `
  return Response.json(rows)
}
