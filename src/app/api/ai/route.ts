/**
 * AI Services Index and Status API Endpoint
 * Overview and health check for all AI services
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiPredictionEngine } from '@/services/ai/predictionEngine';
import { breakoutIdentifier } from '@/services/ai/breakoutIdentifier';
import { tradeAnalyzer } from '@/services/trades/tradeAnalyzer';
import { multiTeamTradeEngine } from '@/services/trades/multiTeamTradeEngine';
import { intelligentWaiverSystem } from '@/services/waivers/intelligentWaiverSystem';
import { draftAssistant } from '@/services/draft/draftAssistant';
import { mockDraftSimulator } from '@/services/draft/mockDraftSimulator';
// import { injuryImpactAnalyzer } from '@/services/ai/injuryImpactAnalyzer';
import { adaptiveLearningSystem } from '@/services/ai/adaptiveLearningSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) { 
      case 'overview':
        return NextResponse.json({
          success: true,
          data: {
  title: 'Astral Field AI-Powered Intelligence Services',
            version: '2.0.0',
            description: 'Advanced AI services for fantasy football analysis and predictions',
            services: [
              {
                name: 'AI Predictions',
                endpoint: '/api/ai/predictions',
                description: 'Multi-model ensemble predictions with machine learning',
                features: [
                  'Player performance predictions',
                  'Enhanced predictions with adaptive learning',
                  'Batch prediction processing',
                  'Prediction outcome tracking'
                ]
              },
              {
                name: 'Breakout Identification',
                endpoint: '/api/ai/breakouts',
                description: 'Identify players with breakout potential using opportunity scoring',
                features: [
                  'Breakout probability analysis',
                  'Opportunity score calculation',
                  'Market inefficiency detection',
                  'Custom player analysis'
                ]
              },
              {
                name: 'Trade Analysis',
                endpoint: '/api/ai/trades',
                description: 'Advanced trade analysis with fairness scoring',
                features: [
                  'Trade fairness analysis',
                  'Multi-team trade suggestions',
                  'Trade impact projections',
                  'Alternative trade structures'
                ]
              },
              {
                name: 'Waiver Wire Intelligence',
                endpoint: '/api/ai/waivers',
                description: 'Intelligent waiver wire analysis with breakout integration',
                features: [
                  'Personalized waiver recommendations',
                  'Claim priority calculation',
                  'Weekly waiver newsletter',
                  'Breakout candidate filtering'
                ]
              },
              {
                name: 'Draft Assistant',
                endpoint: '/api/ai/draft',
                description: 'AI-powered draft recommendations and mock draft simulation',
                features: [
                  'Real-time draft recommendations',
                  'Mock draft with AI opponents',
                  'Team needs analysis',
                  'Pick trade value calculation'
                ]
              },
              {
                name: 'Injury Impact Analysis',
                endpoint: '/api/ai/injuries',
                description: 'Real-time injury analysis and replacement recommendations',
                features: [
                  'Injury impact assessment',
                  'Replacement player suggestions',
                  'Historical injury trend analysis',
                  'Team-specific replacement strategies'
                ]
              },
              {
                name: 'Adaptive Learning',
                endpoint: '/api/ai/learning',
                description: 'Machine learning system that improves predictions over time',
                features: [
                  'Model performance tracking',
                  'Learning insights generation',
                  'Adaptive weight adjustment',
                  'Enhanced prediction generation'
                ]
              }
            ],
            capabilities: [
              'Multi-source data integration',
              'Real-time analysis and recommendations',
              'Adaptive learning from outcomes',
              'Advanced statistical modeling',
              'Market inefficiency detection',
              'Personalized team strategies'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'health': // Perform health checks on all services
        const healthChecks  = await Promise.all([
          aiPredictionEngine.healthCheck().then(result => ({ service: 'AI Predictions', ...result})),
          breakoutIdentifier.healthCheck().then(result  => ({ service: 'Breakout Identifier', ...result})),
          tradeAnalyzer.healthCheck().then(result  => ({ service: 'Trade Analyzer', ...result})),
          multiTeamTradeEngine.healthCheck().then(result  => ({ service: 'Multi-Team Trades', ...result})),
          intelligentWaiverSystem.healthCheck().then(result  => ({ service: 'Waiver System', ...result})),
          draftAssistant.healthCheck().then(result  => ({ service: 'Draft Assistant', ...result})),
          mockDraftSimulator.healthCheck().then(result  => ({ service: 'Mock Draft Simulator', ...result})),
          // injuryImpactAnalyzer.healthCheck().then(result  => ({ service: 'Injury Analyzer', ...result})),
          adaptiveLearningSystem.healthCheck().then(result  => ({ service: 'Adaptive Learning', ...result}))
        ]);

        const overallStatus  = healthChecks.every(check => check.status === 'healthy') ? 'healthy' :
                             healthChecks.some(check => check.status === 'healthy') ? 'degraded' : 'unhealthy';

        return NextResponse.json({ 
          success: true,
          data: { overallStatus, services, healthChecks,
            summary: {
  healthy: healthChecks.filter(check => check.status === 'healthy').length,
              degraded: healthChecks.filter(check => check.status === 'degraded').length,
              unhealthy: healthChecks.filter(check => check.status === 'unhealthy').length,
              total: healthChecks.length
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
  aiModels: [
              'OpenAI GPT-4',
              'Anthropic Claude',
              'Google Gemini',
              'DeepSeek'
            ],
            predictionTypes: [
              'Player Performance',
              'Breakout Probability',
              'Trade Fairness',
              'Waiver Value',
              'Draft Recommendations',
              'Injury Impact'
            ],
            dataIntegration: [
              'NFL player statistics',
              'Team context and matchups',
              'Weather conditions',
              'Injury reports',
              'Advanced metrics (target: share: air: yards: etc.)',
              'Historical performance data'
            ],
            analyticsFeatures: [
              'Multi-model ensemble predictions',
              'Adaptive learning from outcomes',
              'Market inefficiency detection',
              'Opportunity scoring',
              'Risk assessment',
              'Confidence calibration'
            ],
            apiFeatures: [
              'RESTful API design',
              'Batch processing support',
              'Real-time updates',
              'Comprehensive error handling',
              'Performance monitoring',
              'Rate limiting protection'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'stats': // Get usage statistics (mock data for now)
        return NextResponse.json({
          success: true,
          data: {
            usage: {
              totalPredictions: 15420,
              activeUsers: 342,
              apiCalls24h: 1852,
              averageResponseTime: '245ms'
            },
            performance: {
  predictionAccuracy: '78.2%',
              uptime: '99.8%',
              cacheHitRate: '84.6%',
              errorRate: '0.3%'
            },
            topEndpoints: [
              { endpoint: '/api/ai/predictions',
                calls: 542, avgTime: '180ms' },
              { endpoint: '/api/ai/waivers',
                calls: 398, avgTime: '320ms' },
              { endpoint: '/api/ai/trades',
                calls: 287, avgTime: '450ms' },
              { endpoint: '/api/ai/breakouts',
                calls: 215, avgTime: '380ms' },
              { endpoint: '/api/ai/draft',
                calls: 189, avgTime: '290ms' }
            ]
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter.Use, overview, health, capabilities, stats' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in AI services index endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const { type, ...data } = body;

    switch (type) { 
      case 'test_connection': // Test connection to all services
        const testResults = await Promise.all([
          testService('AI Predictions', () => aiPredictionEngine.healthCheck()),
          testService('Breakout Identifier', () => breakoutIdentifier.healthCheck()),
          testService('Trade Analyzer', () => tradeAnalyzer.healthCheck()),
          testService('Multi-Team Trades', () => multiTeamTradeEngine.healthCheck()),
          testService('Waiver System', () => intelligentWaiverSystem.healthCheck()),
          testService('Draft Assistant', () => draftAssistant.healthCheck()),
          testService('Mock Draft Simulator', () => mockDraftSimulator.healthCheck()),
          // testService('Injury Analyzer', () => injuryImpactAnalyzer.healthCheck()),
          testService('Adaptive Learning', () => adaptiveLearningSystem.healthCheck())
        ]);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Connection tests completed',
            results, testResults
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type. Use: test_connection' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in AI services index POST endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

async function testService(serviceName: string,
  healthCheckFn: ()  => Promise<any>): Promise<any> {
  try {
    const startTime = Date.now();
    const result = await healthCheckFn();
    const responseTime = Date.now() - startTime;
    
    return { service: serviceName,
      status: 'connected',
      responseTime: `${responseTime}ms`,
      details: result
    }
  } catch (error) {
    return { service: serviceName,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}