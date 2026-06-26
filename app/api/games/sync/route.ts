import { sql, migrate } from '@/lib/db'
import { fetchBrazilGames, mapStatus, calcPoints } from '@/lib/games'

export async function POST() {
  try {
    await migrate()
    const events = await fetchBrazilGames()

    for (const e of events) {
      const status = mapStatus(e)
      const homeScore = e.intHomeScore !== null ? parseInt(e.intHomeScore) : null
      const awayScore = e.intAwayScore !== null ? parseInt(e.intAwayScore) : null
      const gameDate = `${e.dateEvent}T${e.strTime ?? '00:00:00'}`

      await sql`
        INSERT INTO games (external_id, home_team, away_team, home_flag, away_flag, competition, game_date, home_score, away_score, status)
        VALUES (${e.idEvent}, ${e.strHomeTeam}, ${e.strAwayTeam}, ${e.strHomeTeamBadge ?? null}, ${e.strAwayTeamBadge ?? null}, ${e.strLeague}, ${gameDate}, ${homeScore}, ${awayScore}, ${status})
        ON CONFLICT(external_id) DO UPDATE SET
          home_score = COALESCE(EXCLUDED.home_score, games.home_score),
          away_score = COALESCE(EXCLUDED.away_score, games.away_score),
          status = CASE WHEN games.status = 'finished' THEN 'finished' ELSE EXCLUDED.status END
      `
    }

    // recalculate points and freeze pot for finished games
    const { rows: finished } = await sql<{ id: number; home_score: number; away_score: number }>`
      SELECT id, home_score, away_score FROM games WHERE status = 'finished'
    `

    for (const game of finished) {
      const { rows: palpites } = await sql<{ user_name: string; home_score: number; away_score: number }>`
        SELECT user_name, home_score, away_score FROM palpites WHERE game_id = ${game.id}
      `

      // freeze pot only if not set manually (0)
      await sql`
        UPDATE games SET pot_euros = ${palpites.length}
        WHERE id = ${game.id} AND pot_euros = 0
      `

      for (const p of palpites) {
        const pts = calcPoints(p.home_score, p.away_score, game.home_score, game.away_score)
        await sql`
          UPDATE palpites SET points = ${pts}
          WHERE game_id = ${game.id} AND user_name = ${p.user_name}
        `
      }
    }

    return Response.json({ ok: true, synced: events.length })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Sync failed' }, { status: 500 })
  }
}
