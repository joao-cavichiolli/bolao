export interface SportsDBEvent {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge?: string
  strAwayTeamBadge?: string
  strLeague: string
  dateEvent: string
  strTime: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
}

// FIFA World Cup 2026 league ID on TheSportsDB
const WORLD_CUP_LEAGUE_ID = '4429'
// Brazil national football team ID (fallback)
const BRAZIL_TEAM_ID = '134496'

export async function fetchBrazilGames(): Promise<SportsDBEvent[]> {
  const [leagueNextRes, leaguePastRes, brazilNextRes, brazilLastRes] = await Promise.allSettled([
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${WORLD_CUP_LEAGUE_ID}`, { cache: 'no-store' }),
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${WORLD_CUP_LEAGUE_ID}`, { cache: 'no-store' }),
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${BRAZIL_TEAM_ID}`, { cache: 'no-store' }),
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${BRAZIL_TEAM_ID}`, { cache: 'no-store' }),
  ])

  const events: SportsDBEvent[] = []

  if (leagueNextRes.status === 'fulfilled' && leagueNextRes.value.ok) {
    const data = await leagueNextRes.value.json()
    if (data.events?.length) events.push(...data.events)
  }
  if (leaguePastRes.status === 'fulfilled' && leaguePastRes.value.ok) {
    const data = await leaguePastRes.value.json()
    if (data.events?.length) events.push(...data.events)
  }
  if (brazilNextRes.status === 'fulfilled' && brazilNextRes.value.ok) {
    const data = await brazilNextRes.value.json()
    if (data.events) events.push(...data.events)
  }
  if (brazilLastRes.status === 'fulfilled' && brazilLastRes.value.ok) {
    const data = await brazilLastRes.value.json()
    if (data.results) events.push(...data.results)
    else if (data.events) events.push(...data.events)
  }

  // deduplicate
  const seen = new Set<string>()
  return events.filter((e) => {
    if (seen.has(e.idEvent)) return false
    seen.add(e.idEvent)
    return true
  })
}

export function mapStatus(event: SportsDBEvent): 'upcoming' | 'finished' | 'live' {
  if (event.strStatus === 'Match Finished') return 'finished'
  if (event.intHomeScore !== null && event.intAwayScore !== null) return 'live'
  return 'upcoming'
}

export function calcPoints(
  palpiteHome: number,
  palpiteAway: number,
  realHome: number,
  realAway: number
): number {
  if (palpiteHome === realHome && palpiteAway === realAway) return 3
  const palpiteResult = Math.sign(palpiteHome - palpiteAway)
  const realResult = Math.sign(realHome - realAway)
  if (palpiteResult === realResult) return 1
  return 0
}
