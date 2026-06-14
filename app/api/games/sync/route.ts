import { getDb } from '@/lib/db'
import { fetchBrazilGames, mapStatus } from '@/lib/games'

export async function POST() {
  try {
    const events = await fetchBrazilGames()
    const db = getDb()

    const upsert = db.prepare(`
      INSERT INTO games (external_id, home_team, away_team, home_flag, away_flag, competition, game_date, home_score, away_score, status)
      VALUES (@external_id, @home_team, @away_team, @home_flag, @away_flag, @competition, @game_date, @home_score, @away_score, @status)
      ON CONFLICT(external_id) DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        status = excluded.status
    `)

    const syncMany = db.transaction((evts: typeof events) => {
      for (const e of evts) {
        upsert.run({
          external_id: e.idEvent,
          home_team: e.strHomeTeam,
          away_team: e.strAwayTeam,
          home_flag: e.strHomeTeamBadge ?? null,
          away_flag: e.strAwayTeamBadge ?? null,
          competition: e.strLeague,
          game_date: `${e.dateEvent}T${e.strTime ?? '00:00:00'}`,
          home_score: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
          away_score: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
          status: mapStatus(e),
        })
      }
    })

    syncMany(events)

    // recalculate points for finished games
    const finished = db.prepare(`SELECT * FROM games WHERE status = 'finished'`).all() as {
      id: number; home_score: number; away_score: number
    }[]

    const updatePoints = db.prepare(`
      UPDATE palpites SET points = @points WHERE game_id = @game_id AND user_name = @user_name
    `)
    const getPalpites = db.prepare(`SELECT * FROM palpites WHERE game_id = ?`)

    const { calcPoints } = await import('@/lib/games')

    const updatePot = db.prepare(`UPDATE games SET pot_euros = ? WHERE id = ? AND pot_euros = 0`)

    const recalc = db.transaction(() => {
      for (const game of finished) {
        const palpites = getPalpites.all(game.id) as {
          user_name: string; home_score: number; away_score: number
        }[]
        // freeze pot when game ends (only if not already set manually)
        updatePot.run(palpites.length, game.id)
        for (const p of palpites) {
          const pts = calcPoints(p.home_score, p.away_score, game.home_score, game.away_score)
          updatePoints.run({ points: pts, game_id: game.id, user_name: p.user_name })
        }
      }
    })
    recalc()

    return Response.json({ ok: true, synced: events.length })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Sync failed' }, { status: 500 })
  }
}
