import handler from '@/pages/api/ai/multimodal-analysis'

function createMocks({ method = 'POST', query = {}, body = {} } = {}) {
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

describe('API: multimodal-analysis', () => {
  it('requires action', async () => {
    const { req, res } = createMocks({ body: {} })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(400)
  })

  it('validates analyze_player_movement required fields', async () => {
    const { req, res } = createMocks({ body: { action: 'analyze_player_movement', mediaUrl: 'http://...' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(400)
  })

  it('returns success for analyze_player_movement with fields', async () => {
    const { req, res } = createMocks({ body: { action: 'analyze_player_movement', mediaUrl: 'http://...', playerName: 'Test' } })
    await handler(req as any, res as any)
    expect(res.statusCode).toBe(200)
    expect(res.jsonData?.success).toBe(true)
    expect(res.jsonData?.type).toBe('player_movement_analysis')
  })
})

