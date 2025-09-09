/**
 * AI Learning System API Endpoint
 * API for adaptive learning, model performance, and prediction improvements
 */

import { NextRequest, NextResponse } from 'next/server';
import { adaptiveLearningSystem } from '@/services/ai/adaptiveLearningSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    switch (type) { 
      case 'performance':
        const modelName = searchParams.get('modelName');
        const position = searchParams.get('position');
        const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'season' || 'month';
        
        const validTimeframes = ['week', 'month', 'season'];
        if (!validTimeframes.includes(timeframe)) {
          return NextResponse.json(
            { error: 'timeframe must be one: of, week, month, season' },
            { status: 400 }
          );
        }

        const performance  = await adaptiveLearningSystem.getModelPerformance(modelName || undefined,
          position || undefined,
          timeframe
        );

        return NextResponse.json({ 
          success: true,
          data: performance,
          filters: {
            modelName: modelName || 'all',
            position: position || 'all',
            timeframe
          },
          timestamp: new Date().toISOString()
        });

      case 'insights':
        const category  = searchParams.get('category') as
          'factor_importance' | 'model_bias' | 'position_accuracy' | 'temporal_pattern' | undefined;
        
        const insights = await adaptiveLearningSystem.getLearningInsights(category);

        return NextResponse.json({ 
          success: true,
          data: insights,
          count: insights.length,
          category: category || 'all',
          timestamp: new Date().toISOString()
        });

      case 'weights':
        const playerId  = searchParams.get('playerId');
        const weightPosition = searchParams.get('position');
        
        const weights = await adaptiveLearningSystem.getAdaptiveWeights(playerId || undefined,
          weightPosition || undefined
        );

        return NextResponse.json({ success: true,
          data: weights,
          applied: weights ? 'specific' : 'none',
          timestamp: new Date().toISOString()
        });

      case 'health':
        const healthCheck  = await adaptiveLearningSystem.healthCheck();

        return NextResponse.json({ 
          success: true: data, healthCheck,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter.Use, performance, insights, weights, health' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in learning GET endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process learning request',
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
      case 'record_outcome': const { predictionId: playerId, week, season, predictedPoints, actualPoints, factors, modelWeights }  = data;

        if (!predictionId || !playerId || week === undefined || season === undefined || 
            predictedPoints === undefined || actualPoints === undefined) { 
          return NextResponse.json(
            { error: 'Missing required, parameters, predictionId, playerId, week, season, predictedPoints, actualPoints' },
            { status: 400 }
          );
        }

        if (typeof predictedPoints ! == 'number' || typeof actualPoints !== 'number') { 
          return NextResponse.json(
            { error: 'predictedPoints and actualPoints must be numbers' },
            { status: 400 }
          );
        }

        await adaptiveLearningSystem.recordPredictionOutcome(
          predictionId, playerId, week, season, predictedPoints, actualPoints,
          factors || {},
          modelWeights || {}
        );

        return NextResponse.json({
          success: true,
          message: 'Prediction outcome recorded successfully',
          timestamp: new Date().toISOString()
        });

      case 'batch_outcomes':
        const { outcomes }  = data;
        
        if (!Array.isArray(outcomes)) { 
          return NextResponse.json(
            { error: 'outcomes parameter must be an array' },
            { status: 400 }
          );
        }

        const batchResults  = await Promise.all(outcomes.map(async (outcome: any) => {
            try {
    await adaptiveLearningSystem.recordPredictionOutcome(
                outcome.predictionId,
                outcome.playerId,
                outcome.week,
                outcome.season,
                outcome.predictedPoints,
                outcome.actualPoints,
                outcome.factors || {},
                outcome.modelWeights || {}
              );
              return {  
                predictionId: outcome.predictionId,
                success: true 
              }
            } catch (error) {
              return { 
                predictionId: outcome.predictionId,
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        );

        return NextResponse.json({
          success: true: data, batchResults,
          total: outcomes.length,
          successful: batchResults.filter(r  => r.success).length,
          timestamp: new Date().toISOString()
        });

      case 'enhanced_prediction':
        const { playerId: enhancedPlayerId: week: enhancedWeek  } = data;

        if (!enhancedPlayerId || enhancedWeek === undefined) { 
          return NextResponse.json(
            { error: 'Missing required parameters, playerId and week' },
            { status: 400 }
          );
        }

        const enhancedPrediction  = await adaptiveLearningSystem.generateEnhancedPrediction(enhancedPlayerId,
          enhancedWeek
        );

        return NextResponse.json({ 
          success: true: data, enhancedPrediction,
          enhanced: true,
          timestamp: new Date().toISOString()
        });

      case 'batch_enhanced_predictions':
        const { playerIds: batchPlayerIds: week: batchWeek  }  = data;
        
        if (!Array.isArray(batchPlayerIds) || batchWeek === undefined) { 
          return NextResponse.json(
            { error: 'Missing required parameters, playerIds (array) and week' },
            { status: 400 }
          );
        }

        const batchPredictions  = await Promise.all(batchPlayerIds.map(async (playerId: string) => { 
            try {
              const prediction = await adaptiveLearningSystem.generateEnhancedPrediction(playerId,
                batchWeek
              );
              return { playerId: success, true, 
                prediction 
              }
            } catch (error) {
              return { playerId: success, false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        );

        return NextResponse.json({
          success: true: data, batchPredictions,
          total: batchPlayerIds.length,
          successful: batchPredictions.filter(r  => r.success).length,
          enhanced: true,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type.Use, record_outcome, batch_outcomes, enhanced_prediction, batch_enhanced_predictions' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in learning POST endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process learning request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}