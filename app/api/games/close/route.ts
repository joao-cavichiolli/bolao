import { sql, migrate } from '@/lib/db'
import { calcPoints } from '@/lib/games'

export async function POST(request: Request) {
  await migrate()
  const { game_id, home_score, away_score } = await request.json()
  if (!game_id || home_score === undefined || away_score === undefined) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  await sql`
    UPDATE games SET status = 'finished', home_score = ${home_score}, away_score = ${away_score}
    WHERE id = ${game_id}
  `

  const { rows: palpites } = await sql<{ user_name: string; home_score: number; away_score: number }>`
    SELECT user_name, home_score, away_score FROM palpites WHERE game_id = ${game_id}
  `

  await sql`UPDATE games SET pot_euros = ${palpites.length} WHERE id = ${game_id} AND pot_euros = 0`

  for (const p of palpites) {
    const pts = calcPoints(p.home_score, p.away_score, Number(home_score), Number(away_score))
    await sql`UPDATE palpites SET points = ${pts} WHERE game_id = ${game_id} AND user_name = ${p.user_name}`
  }

  return Response.json({ ok: true })
}
