import { sql, migrate } from '@/lib/db'

export async function GET(request: Request) {
  await migrate()
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')

  if (gameId) {
    const { rows } = await sql`SELECT * FROM palpites WHERE game_id = ${gameId} ORDER BY created_at ASC`
    return Response.json(rows)
  }

  const { rows } = await sql`SELECT * FROM palpites ORDER BY created_at DESC`
  return Response.json(rows)
}

export async function DELETE(request: Request) {
  await migrate()
  const { searchParams } = new URL(request.url)
  const userName = searchParams.get('user_name')
  if (!userName?.trim()) return Response.json({ error: 'user_name obrigatório' }, { status: 400 })

  const { rowCount } = await sql`DELETE FROM palpites WHERE user_name = ${userName.trim()}`
  if (!rowCount) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
  return Response.json({ ok: true, deleted: rowCount })
}

export async function POST(request: Request) {
  await migrate()
  const body = await request.json()
  const { game_id, user_name, home_score, away_score } = body

  if (!game_id || !user_name?.trim() || home_score == null || away_score == null) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { rows } = await sql`SELECT status FROM games WHERE id = ${game_id}`
  const game = rows[0]
  if (!game) return Response.json({ error: 'Jogo não encontrado' }, { status: 404 })
  if (game.status === 'finished') return Response.json({ error: 'Jogo já encerrado' }, { status: 400 })

  try {
    await sql`
      INSERT INTO palpites (game_id, user_name, home_score, away_score)
      VALUES (${game_id}, ${user_name.trim()}, ${parseInt(home_score)}, ${parseInt(away_score)})
      ON CONFLICT(game_id, user_name) DO UPDATE SET
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        created_at = NOW()
    `
    const { rows: updated } = await sql`
      SELECT * FROM palpites WHERE game_id = ${game_id} AND user_name = ${user_name.trim()}
    `
    return Response.json(updated[0], { status: 201 })
  } catch {
    return Response.json({ error: 'Erro ao salvar palpite' }, { status: 500 })
  }
}
