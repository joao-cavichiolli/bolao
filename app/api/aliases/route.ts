import { sql, migrate } from '@/lib/db'

export async function GET() {
  await migrate()
  const { rows } = await sql`SELECT alias_name, canonical_name FROM user_aliases ORDER BY canonical_name, alias_name`
  return Response.json(rows)
}

export async function POST(request: Request) {
  await migrate()
  const { alias_name, canonical_name } = await request.json()
  if (!alias_name?.trim() || !canonical_name?.trim()) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  await sql`
    INSERT INTO user_aliases (alias_name, canonical_name)
    VALUES (${alias_name.trim()}, ${canonical_name.trim()})
    ON CONFLICT(alias_name) DO UPDATE SET canonical_name = EXCLUDED.canonical_name
  `
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  await migrate()
  const { searchParams } = new URL(request.url)
  const alias = searchParams.get('alias_name')
  if (!alias) return Response.json({ error: 'alias_name obrigatório' }, { status: 400 })
  await sql`DELETE FROM user_aliases WHERE alias_name = ${alias}`
  return Response.json({ ok: true })
}
