import { getDb } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')
  const db = getDb()

  if (gameId) {
    const rows = db.prepare(`SELECT * FROM palpites WHERE game_id = ? ORDER BY created_at ASC`).all(gameId)
    return Response.json(rows)
  }

  const rows = db.prepare(`SELECT * FROM palpites ORDER BY created_at DESC`).all()
  return Response.json(rows)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const userName = searchParams.get('user_name')
  if (!userName?.trim()) return Response.json({ error: 'user_name obrigatório' }, { status: 400 })

  const db = getDb()
  const result = db.prepare(`DELETE FROM palpites WHERE user_name = ?`).run(userName.trim())
  if (result.changes === 0) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
  return Response.json({ ok: true, deleted: result.changes })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { game_id, user_name, home_score, away_score } = body

  if (!game_id || !user_name?.trim() || home_score == null || away_score == null) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const db = getDb()

  const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(game_id) as { status: string } | undefined
  if (!game) return Response.json({ error: 'Jogo não encontrado' }, { status: 404 })
  if (game.status === 'finished') return Response.json({ error: 'Jogo já encerrado' }, { status: 400 })

  try {
    db.prepare(`
      INSERT INTO palpites (game_id, user_name, home_score, away_score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(game_id, user_name) DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        created_at = datetime('now')
    `).run(game_id, user_name.trim(), parseInt(home_score), parseInt(away_score))

    const palpite = db.prepare(`SELECT * FROM palpites WHERE game_id = ? AND user_name = ?`).get(game_id, user_name.trim())
    return Response.json(palpite, { status: 201 })
  } catch {
    return Response.json({ error: 'Erro ao salvar palpite' }, { status: 500 })
  }
}
