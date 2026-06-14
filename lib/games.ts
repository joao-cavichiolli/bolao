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

// Brazil national football team ID on TheSportsDB
const BRAZIL_TEAM_ID = '134496'

export async function fetchBrazilGames(): Promise<SportsDBEvent[]> {
  const [nextRes, lastRes] = await Promise.allSettled([
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${BRAZIL_TEAM_ID}`, {
      next: { revalidate: 3600 },
    }),
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${BRAZIL_TEAM_ID}`, {
      next: { revalidate: 3600 },
    }),
  ])

  const events: SportsDBEvent[] = []

  if (nextRes.status === 'fulfilled' && nextRes.value.ok) {
    const data = await nextRes.value.json()
    if (data.events) events.push(...data.events)
  }

  if (lastRes.status === 'fulfilled' && lastRes.value.ok) {
    const data = await lastRes.value.json()
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
  if (event.intHomeScore !== null && event.intAwayScore !== null) return 'finished'
  if (event.strStatus === 'Match Finished') return 'finished'
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
