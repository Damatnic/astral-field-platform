import handler from '@/pages/api/analytics/season-strategy'

jest.mock('@/lib/database', () => {
  const query = jest.fn()
  const healthCheck = jest.fn().mockResolvedValue({ status: 'healthy' })
  const transaction = jest.fn()
  const close = jest.fn()
  return { database: { query, healthCheck, transaction, close } }
})

const { database } = jest.requireMock('@/lib/database') as { database: { query: jest.Mock } }

function createMocks({ method = 'GET', query = {}, body = {} } = {}) {
  const req: any = { method, query, body }
  const res: any = {
    statusCode: 200,
    jsonData: undefined as any,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: any) {
      this.jsonData = data
      return this
    },
  }
  return { req, res }
}

describe('API: season-strategy (SQL path)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.DATABASE_URL = 'postgres://test'
  })

  it('returns sql mode with computed strengths/weaknesses', async () => {
    // latestWeek
    // teamRecent (3 rows)
    // leagueRecent (3 rows)
    // composition (RB:4, WR:5, TE:1)
    // injured count
    // bye weeks next two
    ;(database.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ week: 3 }] })
      .mockResolvedValueOnce({ rows: [{ week: 3, points: 30 }, { week: 2, points: 20 }, { week: 1, points: 10 }] })
      .mockResolvedValueOnce({ rows: [{ week: 3, avg: 25 }, { week: 2, avg: 22 }, { week: 1, avg: 15 }] })
      .mockResolvedValueOnce({ rows: [{ position: 'RB', count: 4 }, { position: 'WR', count: 5 }, { position: 'TE', count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ bye_week: 4 }, { bye_week: 5 }] })

    const { req, res } = createMocks({ method: 'GET', query: { leagueId: 'L', teamId: 'T1' } })
    await handler(req as any, res as any)

    expect(res.statusCode).toBe(200)
    const data = res.jsonData?.data
    expect(data?.mode).toBe('sql')
    expect(Array.isArray(data?.strategyOverview?.strengths)).toBe(true)
    expect(Array.isArray(data?.strategyOverview?.weaknesses)).toBe(true)
    expect(['favorable', 'neutral', 'unfavorable']).toContain(data?.scheduleOutlook?.next3WeeksSOS)
  })
})

