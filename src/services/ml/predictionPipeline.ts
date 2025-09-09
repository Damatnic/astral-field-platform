export interface PerformancePrediction {
  playerId, string,
    week, number,
  predictedPoints, number,
    confidence: number,
  
}
class MLPredictionPipeline { async predictPlayerPerformance(playerId, string,
  week, number,
    _opponentTeam?: string,
  ): : Promise<PerformancePrediction> {
    return { playerId, week, predictedPoints: 0;
  confidence: 0.5  }
  }
}

const mlPipelineService = new MLPredictionPipeline();
export default mlPipelineService;
