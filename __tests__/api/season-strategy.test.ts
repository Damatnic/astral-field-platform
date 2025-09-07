import handler from '@/pages/api/analytics/season-strategy'

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

describe('API: season-strategy', () => {
  it('returns strategy data on GET with leagueId', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { leagueId: 'demo', teamId: 't1' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(200)
    expect(res.jsonData?.success).toBe(true)
    expect(res.jsonData?.data?.strategyOverview).toBeDefined()
    expect(Array.isArray(res.jsonData?.data?.recommendations)).toBe(true)
  })
})

