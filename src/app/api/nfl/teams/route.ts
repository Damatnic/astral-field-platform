import { NextResponse } from 'next/server'
import sportsDataService from '@/services/api/sportsDataService'

export const revalidate = 300 // 5 minutes ISR for Vercel caching

export async function GET() {
  try {
    const teams = await sportsDataService.getTeamsBasic()
    const simplified = teams.map(t => ({
      key: t.Key,
      name: t.Name,
      city: t.City,
      conference: t.Conference,
      division: t.Division,
      fullName: t.FullName,
      byeWeek: t.ByeWeek,
      colors: {
        primary: t.PrimaryColor,
        secondary: t.SecondaryColor,
        tertiary: t.TertiaryColor,
      }
    }))
    return NextResponse.json({ teams: simplified, count: simplified.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch NFL teams' }, { status: 500 })
  }
}

