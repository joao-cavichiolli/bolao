import { sql, migrate } from '@/lib/db'

export async function POST(request: Request) {
  await migrate()
  const { from_game_id, to_game_id } = await request.json()
  if (!from_game_id || !to_game_id) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { rows: [source] } = await sql<{ pot_euros: number }>`
    SELECT pot_euros FROM games WHERE id = ${from_game_id}
  `
  if (!source) return Response.json({ error: 'Jogo origem não encontrado' }, { status: 404 })

  await sql`UPDATE games SET pot_euros = pot_euros + ${source.pot_euros} WHERE id = ${to_game_id}`
  await sql`UPDATE games SET pot_euros = 0 WHERE id = ${from_game_id}`

  return Response.json({ ok: true, transferred: source.pot_euros })
}
