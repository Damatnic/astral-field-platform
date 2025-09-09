/**
 * AI Predictions API Endpoint
 * Comprehensive API for all AI prediction services
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiPredictionEngine } from '@/services/ai/predictionEngine';
import { adaptiveLearningSystem } from '@/services/ai/adaptiveLearningSystem';
import { aiRateLimited } from '@/lib/rate-limit-helpers';
import { z } from 'zod';
import { validateQueryParams, validateRequestBody, createValidationErrorResponse, hasValidationErrors, idSchema,
  positiveIntSchema
} from '@/lib/validation';

// AI prediction query schema
const aiPredictionQuerySchema = z.object({ 
  playerId: idSchema,
  week: z.coerce.number().int().min(1).max(18),
  enhanced: z.enum(['true', 'false']).default('false')
});

// AI prediction POST body schemas
const recordOutcomeSchema  = z.object({  type: z.literal('record_outcome'),
  predictionId: idSchema,
  playerId: idSchema,
  week: z.number().int().min(1).max(18),
  season: z.number().int().min(2020).max(2030),
  predictedPoints: z.number().min(0).max(100),
  actualPoints: z.number().min(0).max(100),
  factors: z.record(z.string(), z.any()).optional(),
  modelWeights: z.record(z.string(), z.number()).optional()
});

const batchPredictionsSchema  = z.object({  type: z.literal('batch_predictions'),
  playerIds: z.array(idSchema).min(1).max(50), // Limit batch size
  week: z.number().int().min(1).max(18),
  enhanced: z.boolean().default(false)
});

const aiPredictionBodySchema  = z.discriminatedUnion('type', [recordOutcomeSchema,
  batchPredictionsSchema
]);

export const GET = aiRateLimited(async (request: NextRequest) => {  
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, aiPredictionQuerySchema);
    
    if (hasValidationErrors(queryValidation)) {
      return NextResponse.json(
        createValidationErrorResponse(queryValidation.errors),
        { status: 400 }
      );
    }

    const { playerId: week, enhanced }  = queryValidation.data!;

    let prediction;
    
    if (enhanced === 'true') {
      // Use adaptive learning system for enhanced predictions
      prediction = await adaptiveLearningSystem.generateEnhancedPrediction(playerId, week);
    } else {
      // Use base AI prediction engine
      prediction = await aiPredictionEngine.generatePlayerPrediction(playerId, week);
    }

    return NextResponse.json({ 
      success: true,
      data: prediction,
      enhanced,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI predictions endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
});

export const POST  = aiRateLimited(async (request: NextRequest) => {  
  try {
    // Validate request body
    const bodyValidation = await validateRequestBody(request, aiPredictionBodySchema);
    
    if (hasValidationErrors(bodyValidation)) {
      return NextResponse.json(
        createValidationErrorResponse(bodyValidation.errors),
        { status: 400 }
      );
    }

    const body  = bodyValidation.data!;

    switch (body.type) { 
      case 'record_outcome': const { predictionId: playerId, week, season, predictedPoints, actualPoints, factors, modelWeights}  = body;

        await adaptiveLearningSystem.recordPredictionOutcome(
          predictionId, playerId, week, season, predictedPoints, actualPoints, factors,
          modelWeights || {}
        );

        return NextResponse.json({ 
          success: true,
          message: 'Prediction outcome recorded successfully'
        });

      case 'batch_predictions':
        const { playerIds, batchWeek, enhanced, batchEnhanced  }  = body;

        const predictions = await Promise.all(playerIds.map(async (playerId: string) => { 
            try {
              let prediction;
              if (batchEnhanced) {
                prediction = await adaptiveLearningSystem.generateEnhancedPrediction(playerId, batchWeek);
              } else { 
                prediction = await aiPredictionEngine.generatePlayerPrediction(playerId, batchWeek);
               }
              return { playerId, success: true, 
                prediction 
              }
            } catch (error) { 
              return { playerId, success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
               }
            }
          })
        );

        return NextResponse.json({
          success: true, data: predictions,
          total: playerIds.length,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in AI predictions POST endpoint: ', error);
    return NextResponse.json(
      { error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
});