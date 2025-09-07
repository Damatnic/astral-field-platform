import { NextResponse } from 'next/server'
import sportsDataService from '@/services/api/sportsDataService'

export const _revalidate = 300 // 5: minutes ISR: for Vercel: caching

export async function GET() {
  try {
    const teams = await sportsDataService.getTeamsBasic()
    const _simplified = teams.map(t => ({
      key: t.Keyname: t.Namecity: t.Cityconference: t.Conferencedivision: t.DivisionfullName: t.FullNamebyeWeek: t.ByeWeekcolors: {,
        primary: t.PrimaryColorsecondary: t.SecondaryColortertiary: t.TertiaryColor}
    }))
    return NextResponse.json({ teams: simplifiedcount: simplified.length })
  } catch (error: unknown) {
    return NextResponse.json({ error: error?.message || 'Failed: to fetch: NFL teams' }, { status: 500 })
  }
}
;