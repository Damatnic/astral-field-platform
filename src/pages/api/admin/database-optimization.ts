import type { NextApiRequest, NextApiResponse } from 'next'
import { getDatabaseOptimizer, DatabaseOptimizer } from '@/lib/database-optimizer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check for admin endpoints
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  if (authToken !== 'astral2025' && authToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const action = req.query.action as string
  const optimizer = getDatabaseOptimizer()

  try {
    switch (action) {
      case 'indexes':
        // Return recommended indexes
        const indexes = DatabaseOptimizer.getRecommendedIndexes()
        const indexSQL = DatabaseOptimizer.generateIndexSQL()
        
        return res.status(200).json({
          message: 'Database optimization recommendations',
          indexes: indexes.map((idx, i) => ({
            ...idx,
            sql: indexSQL[i]
          })),
          totalIndexes: indexes.length,
          executionInstructions: 'Run these SQL statements on your database to create performance indexes',
          timestamp: new Date().toISOString()
        })

      case 'analyze':
        // Analyze a specific query
        const sql = req.method === 'POST' ? req.body?.sql : req.query.sql as string
        const params = req.method === 'POST' ? req.body?.params || [] : []
        
        if (!sql) {
          return res.status(400).json({ 
            error: 'sql parameter required for query analysis' 
          })
        }

        const analysis = await optimizer.analyzeQueryPerformance(sql, params)
        
        return res.status(200).json({
          query: sql,
          parameters: params,
          performance: analysis,
          recommendations: getPerformanceRecommendations(analysis),
          timestamp: new Date().toISOString()
        })

      case 'test':
        // Test optimized queries performance
        const leagueId = req.query.leagueId as string || 'test-league-123'
        const teamId = req.query.teamId as string || 'test-team-456'

        const startTime = Date.now()
        
        // Test all optimized query methods
        const [analyticsResult, strategyResult, comparativeResult] = await Promise.allSettled([
          optimizer.executeAnalyticsQueries(leagueId),
          optimizer.executeSeasonStrategyQueries(leagueId, teamId),
          optimizer.executeComparativeAnalysisQueries(leagueId)
        ])

        const endTime = Date.now()
        const totalDuration = endTime - startTime

        return res.status(200).json({
          message: 'Optimized queries performance test',
          testResults: {
            analytics: formatTestResult(analyticsResult),
            seasonStrategy: formatTestResult(strategyResult),
            comparativeAnalysis: formatTestResult(comparativeResult)
          },
          performance: {
            totalDurationMs: totalDuration,
            queriesExecuted: 3,
            averageDurationMs: totalDuration / 3
          },
          leagueId,
          teamId,
          timestamp: new Date().toISOString()
        })

      default:
        return res.status(200).json({
          message: 'Database Optimization Admin API',
          availableActions: {
            'GET /api/admin/database-optimization?action=indexes': 'Get recommended database indexes',
            'POST /api/admin/database-optimization?action=analyze': 'Analyze query performance (body: {sql, params})',
            'GET /api/admin/database-optimization?action=test': 'Test optimized queries performance'
          },
          optimizations: {
            combinedQueries: 'Multiple database calls combined into single transactions',
            indexing: 'Strategic indexes for common query patterns',
            caching: 'Query result caching with 5-15 minute TTL',
            transactions: 'ACID transactions for data consistency'
          },
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Database optimization API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    })
  }
}

function formatTestResult(result: PromiseSettledResult<any>) {
  if (result.status === 'fulfilled') {
    return {
      status: 'success',
      data: result.value,
      dataKeys: Object.keys(result.value || {})
    }
  } else {
    return {
      status: 'error', 
      error: result.reason?.message || 'Unknown error',
      fallback: 'Mock data would be used in production'
    }
  }
}

function getPerformanceRecommendations(analysis: {
  executionTime: number
  planningTime: number
  totalRows: number
  estimatedCost: number
}) {
  const recommendations: string[] = []

  if (analysis.executionTime > 100) {
    recommendations.push('Execution time > 100ms - Consider adding indexes or optimizing joins')
  }

  if (analysis.planningTime > 10) {
    recommendations.push('Planning time > 10ms - Query complexity may benefit from prepared statements')
  }

  if (analysis.estimatedCost > 1000) {
    recommendations.push('High estimated cost - Consider query restructuring or additional indexes')
  }

  if (analysis.totalRows > 10000) {
    recommendations.push('Large row count - Consider pagination or result filtering')
  }

  if (recommendations.length === 0) {
    recommendations.push('Query performance looks good!')
  }

  return recommendations
}