import { sql } from '@vercel/postgres'

export async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      external_id TEXT UNIQUE,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_flag TEXT,
      away_flag TEXT,
      competition TEXT,
      game_date TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      pot_euros INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS palpites (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(id),
      user_name TEXT NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(game_id, user_name)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_palpites_game ON palpites(game_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_palpites_user ON palpites(user_name)`
}

export { sql }
