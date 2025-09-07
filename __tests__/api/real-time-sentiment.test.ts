import handler from '@/pages/api/ai/real-time-sentiment'

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

describe('API: real-time-sentiment validation', () => {
  it('rejects subscribe_alerts without subscriptionData', async () => {
    const { req, res } = createMocks({ method: 'POST', body: { action: 'subscribe_alerts' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(400)
    expect(res.jsonData?.error).toBeDefined()
  })

  it('rejects analyze_custom_content without content', async () => {
    const { req, res } = createMocks({ method: 'POST', body: { action: 'analyze_custom_content' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(400)
    expect(res.jsonData?.error).toBeDefined()
  })

  it('rejects player_summary without player', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { type: 'player_summary' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(400)
    expect(res.jsonData?.error).toBeDefined()
  })

  it('returns current_trends on GET', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { type: 'current_trends' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(200)
    expect(res.jsonData?.success).toBe(true)
    expect(Array.isArray(res.jsonData?.data)).toBe(true)
  })
})

