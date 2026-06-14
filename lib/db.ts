import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'bolao.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    migrate(_db)
  }
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_flag TEXT,
      away_flag TEXT,
      competition TEXT,
      game_date TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT DEFAULT 'upcoming',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS palpites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id),
      user_name TEXT NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(game_id, user_name)
    );

    CREATE INDEX IF NOT EXISTS idx_palpites_game ON palpites(game_id);
    CREATE INDEX IF NOT EXISTS idx_palpites_user ON palpites(user_name);
  `)
}
