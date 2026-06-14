import { sql, migrate } from '@/lib/db'

export async function GET() {
  await migrate()
  const { rows } = await sql`SELECT * FROM games ORDER BY game_date ASC`
  return Response.json(rows)
}
