import handler from '@/pages/api/analytics/performance-attribution'

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

describe('API: performance-attribution (SQL path)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.DATABASE_URL = 'postgres://test'
  })

  it('returns leagueAverages and activity when SQL metrics succeed', async () => {
    // Mock sequence: latestWeek, avg, waivers, trades, injuries
    ;(database.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ week: 3 }] })
      .mockResolvedValueOnce({ rows: [{ avg: '110.25' }] })
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })

    const { req, res } = createMocks({ method: 'GET', query: { leagueId: 'league-1' } })
    await handler(req as any, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.jsonData?.success).toBe(true)
    expect(res.jsonData?.data?.leagueAverages).toEqual({ latestWeek: 3, averagePoints: 110.25 })
    expect(res.jsonData?.data?.activity).toEqual({ waiversProcessed: 2, tradesAccepted: 1 })
  })
})

