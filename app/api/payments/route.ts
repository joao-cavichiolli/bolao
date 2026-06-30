import { sql, migrate } from '@/lib/db'

export async function GET() {
  await migrate()
  const { rows } = await sql`SELECT id, nome, amount, notes, created_at FROM payments ORDER BY created_at DESC`
  return Response.json(rows)
}

export async function POST(request: Request) {
  await migrate()
  const { nome, amount, notes } = await request.json()
  if (!nome?.trim() || !amount) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  const { rows } = await sql`
    INSERT INTO payments (nome, amount, notes) VALUES (${nome.trim()}, ${amount}, ${notes ?? null})
    RETURNING id, nome, amount, notes, created_at
  `
  return Response.json(rows[0])
}

export async function DELETE(request: Request) {
  await migrate()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })
  await sql`DELETE FROM payments WHERE id = ${id}`
  return Response.json({ ok: true })
}
