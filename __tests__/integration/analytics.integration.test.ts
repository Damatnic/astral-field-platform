const { createMocks } = require('node-mocks-http')
const performanceAttributionHandler = require('@/pages/api/analytics/performance-attribution').default
const seasonStrategyHandler = require('@/pages/api/analytics/season-strategy').default  
const comparativeAnalysisHandler = require('@/pages/api/analytics/comparative-analysis').default

function createTestMocks({ method = 'GET', query = {}, body = {} } = {}) {
  const { req, res } = createMocks({ method, query, body })
  
  // Add json response tracker
  const jsonMock = jest.fn()
  const statusMock = jest.fn(() => ({ json: jsonMock }))
  
  res.status = statusMock
  res.json = jsonMock
  
  return { req, res, jsonMock, statusMock }
}

describe('Analytics API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Performance Attribution Endpoint', () => {
    it('should return performance attribution data with database', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: { leagueId: 'test-league-123' }
      })

      // Set up database environment for testing
      const originalDbUrl = process.env.DATABASE_URL
      process.env.DATABASE_URL = 'postgresql://test'

      await performanceAttributionHandler(req, res)

      // Check if response was sent
      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]

      expect(response).toHaveProperty('attribution')
      expect(Array.isArray(response.attribution)).toBe(true)
      expect(response).toHaveProperty('totalImpact')
      expect(typeof response.totalImpact).toBe('number')
      expect(response).toHaveProperty('mode')

      // Restore environment
      if (originalDbUrl) {
        process.env.DATABASE_URL = originalDbUrl
      } else {
        delete process.env.DATABASE_URL
      }
    })

    it('should return mock data without database', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: { leagueId: 'test-league-123' }
      })

      // Ensure no database URL
      delete process.env.DATABASE_URL
      delete process.env.NEON_DATABASE_URL

      await performanceAttributionHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]

      expect(response).toHaveProperty('attribution')
      expect(response).toHaveProperty('mode', 'mock')
      expect(Array.isArray(response.attribution)).toBe(true)
      expect(response.attribution.length).toBeGreaterThan(0)
    })

    it('should handle POST requests', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'POST',
        body: { leagueId: 'test-league-123' }
      })

      await performanceAttributionHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]
      expect(response).toHaveProperty('attribution')
    })

    it('should reject unsupported methods', async () => {
      const { req, res, statusMock, jsonMock } = createTestMocks({
        method: 'DELETE'
      })

      await performanceAttributionHandler(req, res)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' })
    })
  })

  describe('Season Strategy Endpoint', () => {
    it('should return strategy recommendations', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: { leagueId: 'test-league-123', teamId: 'test-team-456' }
      })

      await seasonStrategyHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]

      expect(response).toHaveProperty('recommendations')
      expect(Array.isArray(response.recommendations)).toBe(true)
      expect(response).toHaveProperty('currentWeek')
      expect(response).toHaveProperty('mode')
      
      if (response.recommendations.length > 0) {
        const recommendation = response.recommendations[0]
        expect(recommendation).toHaveProperty('action')
        expect(recommendation).toHaveProperty('rationale')
        expect(recommendation).toHaveProperty('expectedImpact')
        expect(['high', 'medium', 'low']).toContain(recommendation.expectedImpact)
      }
    })

    it('should handle missing team ID gracefully', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: { leagueId: 'test-league-123' }
      })

      await seasonStrategyHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]
      expect(response).toHaveProperty('mode', 'mock')
    })
  })

  describe('Comparative Analysis Endpoint', () => {
    it('should return league comparison data', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: { leagueId: 'test-league-123' }
      })

      await comparativeAnalysisHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]

      expect(response).toHaveProperty('leagueMetrics')
      expect(response).toHaveProperty('teamRankings')
      expect(response).toHaveProperty('insights')
      expect(response).toHaveProperty('mode')

      expect(Array.isArray(response.teamRankings)).toBe(true)
      expect(Array.isArray(response.insights)).toBe(true)
      
      const leagueMetrics = response.leagueMetrics
      expect(leagueMetrics).toHaveProperty('averageScore')
      expect(leagueMetrics).toHaveProperty('standardDeviation')
      expect(leagueMetrics).toHaveProperty('totalTeams')
    })

    it('should include proper statistical data', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'POST',
        body: { leagueId: 'test-league-123' }
      })

      await comparativeAnalysisHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]

      const metrics = response.leagueMetrics
      expect(typeof metrics.averageScore).toBe('number')
      expect(typeof metrics.standardDeviation).toBe('number')
      expect(typeof metrics.totalTeams).toBe('number')
      expect(metrics.totalTeams).toBeGreaterThan(0)

      if (response.teamRankings.length > 0) {
        const ranking = response.teamRankings[0]
        expect(ranking).toHaveProperty('teamName')
        expect(ranking).toHaveProperty('score')
        expect(ranking).toHaveProperty('rank')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: { leagueId: 'test-league-123' }
      })

      // Set invalid database URL to trigger error
      process.env.DATABASE_URL = 'invalid://connection'

      await performanceAttributionHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]
      
      // Should fallback to mock data
      expect(response).toHaveProperty('mode', 'mock')
      expect(response).toHaveProperty('attribution')

      // Clean up
      delete process.env.DATABASE_URL
    })

    it('should validate required parameters', async () => {
      const { req, res, jsonMock } = createTestMocks({
        method: 'GET',
        query: {} // Missing leagueId
      })

      await seasonStrategyHandler(req, res)

      expect(jsonMock).toHaveBeenCalled()
      const response = jsonMock.mock.calls[0][0]
      
      // Should return mock data when parameters are missing
      expect(response).toHaveProperty('mode', 'mock')
    })
  })

  describe('Response Format Validation', () => {
    it('should return consistent response formats across endpoints', async () => {
      const endpoints = [
        { handler: performanceAttributionHandler, requiredFields: ['attribution', 'totalImpact', 'mode'] },
        { handler: seasonStrategyHandler, requiredFields: ['recommendations', 'currentWeek', 'mode'] },
        { handler: comparativeAnalysisHandler, requiredFields: ['leagueMetrics', 'teamRankings', 'insights', 'mode'] }
      ]

      for (const { handler, requiredFields } of endpoints) {
        const { req, res, jsonMock } = createTestMocks({
          method: 'GET',
          query: { leagueId: 'test-league-123', teamId: 'test-team-456' }
        })

        await handler(req, res)

        expect(jsonMock).toHaveBeenCalled()
        const response = jsonMock.mock.calls[0][0]

        requiredFields.forEach(field => {
          expect(response).toHaveProperty(field)
        })

        expect(['sql', 'mock']).toContain(response.mode)
      }
    })
  })
})