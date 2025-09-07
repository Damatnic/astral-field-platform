import handler from '@/pages/api/analytics/comparative-analysis'

function createMocks({ method = 'GET', query = {}, body = {} } = {}) {
  const req: any = { 
    method, 
    query, 
    body,
    headers: { 'user-agent': 'test', 'x-forwarded-for': '127.0.0.1' },
    connection: { remoteAddress: '127.0.0.1' }
  }
  const res: any = {
    statusCode: 200,
    jsonData: undefined as any,
    headers: {} as any,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: any) {
      this.jsonData = data
      return this
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value
      return this
    }
  }
  return { req, res }
}

describe('API: comparative-analysis', () => {
  it('returns comparative metrics on GET', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { leagueId: 'demo' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(200)
    expect(res.jsonData?.success).toBe(true)
    const data = res.jsonData?.data
    expect(data?.comparativeMetrics).toBeDefined()
    expect(data?.benchmarkingInsights).toBeDefined()
    expect(Array.isArray(data?.detailedComparisons)).toBe(true)
  })
})

