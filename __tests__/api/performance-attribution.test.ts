import handler from '@/pages/api/analytics/performance-attribution'

function createMocks({ method = 'GET', query = {}, body = {} } = {}) {
  const req: any = { method, query, body }
  const res: any = {
    statusCode: 0,
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

describe('API: performance-attribution', () => {
  it('responds with structured data on GET', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { leagueId: 'demo' } })
    await handler(req as any, res as any)
    expect(res.statusCode || 200).toBe(200)
    expect(res.jsonData?.attribution).toBeDefined()
    expect(res.jsonData?.totalImpact).toBeDefined()
    expect(res.jsonData?.mode).toBeDefined()
    expect(Array.isArray(res.jsonData?.attribution)).toBe(true)
    expect(res.jsonData?.attribution?.length).toBeGreaterThan(0)
    expect(typeof res.jsonData?.totalImpact).toBe('number')
    expect(['sql', 'mock', 'error-fallback']).toContain(res.jsonData?.mode)
  })

  it('responds with cached data on subsequent requests', async () => {
    const { req: req1, res: res1 } = createMocks({ method: 'GET', query: { leagueId: 'test-cache' } })
    const { req: req2, res: res2 } = createMocks({ method: 'GET', query: { leagueId: 'test-cache' } })
    
    // First request
    await handler(req1 as any, res1 as any)
    const firstResponse = res1.jsonData
    
    // Second request (should be cached)
    await handler(req2 as any, res2 as any)
    const secondResponse = res2.jsonData
    
    expect(firstResponse?.attribution).toEqual(secondResponse?.attribution)
    expect(firstResponse?.mode).toBe(secondResponse?.mode)
  })
})

