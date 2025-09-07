import handler from '@/pages/api/analytics/comparative-analysis'

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

describe('API: comparative-analysis (SQL path)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.DATABASE_URL = 'postgres://test'
  })

  it('returns live comparative metrics when SQL succeeds', async () => {
    // size, latestWeek, avg/std, waivers, trades, lineup teams_set, trade participants, waiver participants
    ;(database.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: 10 }] }) // size
      .mockResolvedValueOnce({ rows: [{ week: 3 }] }) // latest
      .mockResolvedValueOnce({ rows: [{ avg: '111.5', std: '18.2' }] }) // avg,std
      .mockResolvedValueOnce({ rows: [{ count: 20 }] }) // waivers
      .mockResolvedValueOnce({ rows: [{ count: 6 }] }) // trades
      .mockResolvedValueOnce({ rows: [{ teams_set: 9 }] }) // lineup set
      .mockResolvedValueOnce({ rows: [{ participants: 7 }] }) // trade part
      .mockResolvedValueOnce({ rows: [{ participants: 8 }] }) // waiver part

    const { req, res } = createMocks({ method: 'GET', query: { leagueId: 'league-1' } })
    await handler(req as any, res as any)

    expect(res.statusCode).toBe(200)
    const data = res.jsonData?.data
    expect(data?.comparativeMetrics?.userLeague?.size).toBe(10)
    expect(data?.industryPositioning?.includes('Live metrics enabled')).toBe(true)
  })
})

