import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const games = db.prepare(`
    SELECT * FROM games ORDER BY game_date ASC
  `).all()
  return Response.json(games)
}
