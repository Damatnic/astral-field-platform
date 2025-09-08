# Astral Field Technical Implementation Guide

## Based on AstralDraftv2 Architecture Analysis

This guide provides detailed technical specifications for implementing the critical features identified in the feature gap analysis, with code examples and architecture patterns derived from AstralDraftv2.

## 1. AI Oracle System Implementation

### Architecture Overview

AstralDraftv2's Oracle system uses a multi-model ensemble approach with extensive feature engineering. Here's how to implement it:

### Core ML Service Structure

```typescript
// src/services/ml/predictionEngine.ts

export interface PlayerPredictionFeatures {
  // Historical performance (last 5 games)
  recentPerformance: number[];
  seasonAverage: number;
  careerAverage: number;
  consistencyScore: number; // 0-1 volatility measure
  
  // Matchup analysis
  matchupDifficulty: number; // 0-10 scale
  positionRank: number; // 1-32
  targetShare: number; // For receivers
  redZoneTargets: number;
  
  // Team context
  teamOffensiveRank: number;
  teamPaceRank: number;
  gameScript: 'positive' | 'neutral' | 'negative';
  
  // Environmental
  weather: WeatherImpact;
  venue: 'home' | 'away';
  restDays: number;
  
  // Health
  injuryRisk: number; // 0-1 probability
  recoveryStatus: 'healthy' | 'limited' | 'questionable';
}

export interface ModelConsensus {
  linearRegression: ModelPrediction;
  randomForest: ModelPrediction;
  gradientBoosting: ModelPrediction;
  neuralNetwork: ModelPrediction;
  ensemble: ModelPrediction;
}

export class MLPredictionEngine {
  private models: Map<string, BaseModel>;
  
  constructor() {
    this.models = new Map([
      ['linear', new LinearRegressionModel()],
      ['rf', new RandomForestModel()],
      ['gb', new GradientBoostingModel()],
      ['nn', new NeuralNetworkModel()],
    ]);
  }
  
  async predictPlayerPerformance(
    playerId: string,
    week: number
  ): Promise<PlayerPredictionResult> {
    // 1. Feature extraction
    const features = await this.extractFeatures(playerId, week);
    
    // 2. Run all models
    const predictions = await Promise.all(
      Array.from(this.models.entries()).map(async ([name, model]) => {
        const pred = await model.predict(features);
        return { name, prediction: pred };
      })
    );
    
    // 3. Ensemble combination
    const ensemble = this.combineEnsemble(predictions);
    
    // 4. Calculate confidence intervals
    const confidence = this.calculateConfidence(predictions);
    
    return {
      playerId,
      fantasyPoints: ensemble,
      confidence,
      ceiling: ensemble.high * 1.2,
      floor: ensemble.low * 0.8,
      modelConsensus: this.buildConsensus(predictions),
    };
  }
  
  private combineEnsemble(predictions: ModelPrediction[]): PredictionRange {
    // Weighted average based on model performance
    const weights = this.getModelWeights();
    const weighted = predictions.reduce((sum, pred, i) => {
      return sum + (pred.value * weights[i]);
    }, 0);
    
    return {
      expected: weighted,
      low: weighted * 0.85,
      high: weighted * 1.15,
      probability: this.calculateProbability(predictions)
    };
  }
}
```

### Feature Engineering Pipeline

```typescript
// src/services/ml/featureEngineering.ts

export class FeatureEngineeringPipeline {
  async extractFeatures(
    playerId: string,
    week: number
  ): Promise<FeatureVector> {
    const [
      historicalData,
      matchupData,
      weatherData,
      injuryData
    ] = await Promise.all([
      this.getHistoricalPerformance(playerId),
      this.getMatchupAnalysis(playerId, week),
      this.getWeatherImpact(week),
      this.getInjuryStatus(playerId)
    ]);
    
    // Advanced feature creation
    const features = {
      // Rolling averages
      ma3: this.movingAverage(historicalData, 3),
      ma5: this.movingAverage(historicalData, 5),
      
      // Trend analysis
      trend: this.calculateTrend(historicalData),
      momentum: this.calculateMomentum(historicalData),
      
      // Matchup-adjusted projections
      matchupAdjustment: this.adjustForMatchup(
        historicalData.average,
        matchupData.difficulty
      ),
      
      // Composite scores
      opportunityScore: this.calculateOpportunity(
        matchupData.targetShare,
        matchupData.redZoneTargets,
        matchupData.snapCount
      ),
      
      // Volatility measures
      consistency: this.calculateConsistency(historicalData),
      
      // Interaction features
      homeAdvantage: venue === 'home' ? 1.05 : 0.95,
      restAdvantage: this.calculateRestAdvantage(restDays),
      
      // Normalized features for NN
      ...this.normalizeFeatures({
        ...historicalData,
        ...matchupData,
        ...weatherData,
        ...injuryData
      })
    };
    
    return features;
  }
  
  private calculateOpportunity(
    targetShare: number,
    redZone: number,
    snaps: number
  ): number {
    return (targetShare * 0.5) + (redZone * 0.3) + (snaps * 0.2);
  }
}
```

## 2. Real-Time Draft Room Implementation

### WebSocket Architecture

```typescript
// src/services/websocket/draftService.ts

export class DraftWebSocketService {
  private io: Server;
  private rooms: Map<string, DraftRoom>;
  
  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join-draft', async (data) => {
        const { leagueId, userId } = data;
        
        // Validate user belongs to league
        if (!await this.validateUser(leagueId, userId)) {
          socket.emit('error', 'Unauthorized');
          return;
        }
        
        // Join or create room
        const room = this.getOrCreateRoom(leagueId);
        room.addUser(userId, socket);
        
        socket.join(`draft-${leagueId}`);
        
        // Send current state
        socket.emit('draft-state', room.getState());
        
        // Notify others
        socket.to(`draft-${leagueId}`).emit('user-joined', {
          userId,
          timestamp: Date.now()
        });
      });
      
      socket.on('make-pick', async (data) => {
        const { leagueId, playerId, userId } = data;
        const room = this.rooms.get(leagueId);
        
        if (!room || !room.isUserTurn(userId)) {
          socket.emit('error', 'Not your turn');
          return;
        }
        
        // Process pick
        const result = await room.processPick(userId, playerId);
        
        if (result.success) {
          // Broadcast to all
          this.io.to(`draft-${leagueId}`).emit('pick-made', {
            userId,
            playerId,
            pick: result.pickNumber,
            nextUp: result.nextUser,
            timestamp: Date.now()
          });
          
          // Start timer for next pick
          room.startTimer(result.nextUser);
        } else {
          socket.emit('error', result.error);
        }
      });
      
      socket.on('auto-draft-toggle', async (data) => {
        const { leagueId, userId, enabled } = data;
        const room = this.rooms.get(leagueId);
        
        if (room) {
          room.setAutoDraft(userId, enabled);
          
          socket.emit('auto-draft-status', { enabled });
        }
      });
    });
  }
}
```

### Draft Room Component

```typescript
// src/components/draft/DraftRoom.tsx

export const DraftRoom: React.FC<{ leagueId: string }> = ({ leagueId }) => {
  const [draftState, setDraftState] = useState<DraftState>();
  const [timeRemaining, setTimeRemaining] = useState(90);
  const socket = useWebSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Join draft room
    socket.emit('join-draft', { leagueId, userId: currentUser.id });
    
    // Set up listeners
    socket.on('draft-state', (state) => {
      setDraftState(state);
    });
    
    socket.on('pick-made', (data) => {
      // Update local state
      setDraftState(prev => ({
        ...prev,
        picks: [...prev.picks, data],
        currentPick: data.nextUp
      }));
      
      // Reset timer
      setTimeRemaining(90);
      
      // Show notification
      toast.success(`${data.playerName} selected!`);
    });
    
    socket.on('timer-update', (time) => {
      setTimeRemaining(time);
    });
    
    return () => {
      socket.off('draft-state');
      socket.off('pick-made');
      socket.off('timer-update');
    };
  }, [socket, leagueId]);
  
  const makePick = (playerId: string) => {
    socket.emit('make-pick', { leagueId, playerId, userId: currentUser.id });
  };
  
  return (
    <div className="grid grid-cols-12 gap-4 h-screen">
      {/* Draft Board - 3 columns */}
      <div className="col-span-3 bg-white/10 backdrop-blur-md rounded-lg p-4">
        <DraftBoard picks={draftState?.picks} />
      </div>
      
      {/* Player List - 6 columns */}
      <div className="col-span-6 bg-white/10 backdrop-blur-md rounded-lg p-4">
        <PlayerList 
          available={draftState?.availablePlayers}
          onSelect={makePick}
          isMyTurn={draftState?.currentPick === currentUser.id}
        />
      </div>
      
      {/* My Team & Chat - 3 columns */}
      <div className="col-span-3 space-y-4">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <MyRoster roster={draftState?.myRoster} />
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <DraftChat leagueId={leagueId} />
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <TurnTimer 
            timeRemaining={timeRemaining}
            isMyTurn={draftState?.currentPick === currentUser.id}
          />
        </div>
      </div>
    </div>
  );
};
```

## 3. Trade Analysis Engine

### Trade Evaluation Algorithm

```typescript
// src/services/trade/tradeAnalyzer.ts

export class TradeAnalyzer {
  private mlEngine: MLPredictionEngine;
  
  async analyzeTrade(trade: TradeProposal): Promise<TradeAnalysis> {
    // Get all players involved
    const allPlayers = [
      ...trade.team1Gives,
      ...trade.team2Gives
    ];
    
    // Get rest-of-season projections
    const projections = await Promise.all(
      allPlayers.map(p => this.mlEngine.getROSProjection(p.id))
    );
    
    // Calculate team values
    const team1Value = this.calculateTeamValue(
      trade.team1Gives,
      projections
    );
    const team2Value = this.calculateTeamValue(
      trade.team2Gives,
      projections
    );
    
    // Calculate fairness
    const fairnessScore = this.calculateFairness(team1Value, team2Value);
    
    // Impact on playoff probability
    const team1Impact = await this.calculatePlayoffImpact(
      trade.team1Id,
      trade.team1Gets,
      trade.team1Gives
    );
    const team2Impact = await this.calculatePlayoffImpact(
      trade.team2Id,
      trade.team2Gets,
      trade.team2Gives
    );
    
    // Position needs analysis
    const team1Needs = await this.analyzePositionNeeds(
      trade.team1Id,
      trade
    );
    const team2Needs = await this.analyzePositionNeeds(
      trade.team2Id,
      trade
    );
    
    return {
      fairnessScore,
      recommendation: this.getRecommendation(fairnessScore),
      team1: {
        valueGained: team2Value - team1Value,
        playoffImpact: team1Impact,
        needsFilled: team1Needs,
        grade: this.calculateGrade(team2Value - team1Value, team1Impact)
      },
      team2: {
        valueGained: team1Value - team2Value,
        playoffImpact: team2Impact,
        needsFilled: team2Needs,
        grade: this.calculateGrade(team1Value - team2Value, team2Impact)
      },
      insights: this.generateInsights(trade, projections),
      alternativeSuggestions: await this.suggestAlternatives(trade)
    };
  }
  
  private calculateFairness(value1: number, value2: number): number {
    const diff = Math.abs(value1 - value2);
    const avg = (value1 + value2) / 2;
    const percentDiff = (diff / avg) * 100;
    
    // Convert to 0-100 fairness score
    return Math.max(0, 100 - percentDiff);
  }
  
  private async calculatePlayoffImpact(
    teamId: string,
    playersGained: Player[],
    playersLost: Player[]
  ): Promise<number> {
    // Get current playoff probability
    const currentProb = await this.getPlayoffProbability(teamId);
    
    // Simulate with new roster
    const newProb = await this.simulatePlayoffProbability(
      teamId,
      playersGained,
      playersLost
    );
    
    return newProb - currentProb;
  }
}
```

## 4. Mobile-First Responsive Design

### Mobile Hook Implementation

```typescript
// src/hooks/useMobile.ts

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 640);
      setIsTablet(window.innerWidth > 640 && window.innerWidth <= 1024);
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);
  
  return { isMobile, isTablet, orientation };
};
```

### Mobile-Optimized Component Pattern

```typescript
// src/components/mobile/MobilePlayerCard.tsx

export const MobilePlayerCard: React.FC<{ player: Player }> = ({ player }) => {
  const [expanded, setExpanded] = useState(false);
  const { swipeHandlers, swiping } = useSwipe({
    onSwipedLeft: () => handleAction('bench'),
    onSwipedRight: () => handleAction('start'),
    trackMouse: false
  });
  
  return (
    <motion.div
      {...swipeHandlers}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: swiping ? swiping.deltaX : 0
      }}
      className="relative touch-manipulation"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        {/* Collapsed View */}
        <div 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {player.position}
            </div>
            <div>
              <h3 className="font-semibold text-white">{player.name}</h3>
              <p className="text-xs text-gray-400">{player.team}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-green-400">
              {player.projectedPoints}
            </div>
            <div className="text-xs text-gray-400">proj pts</div>
          </div>
        </div>
        
        {/* Expanded View */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {player.lastWeekPoints}
                  </div>
                  <div className="text-xs text-gray-400">Last Week</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {player.seasonAvg}
                  </div>
                  <div className="text-xs text-gray-400">Season Avg</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {player.consistency}%
                  </div>
                  <div className="text-xs text-gray-400">Consistency</div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2 mt-4">
                <button className="flex-1 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                  Details
                </button>
                <button className="flex-1 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm">
                  Trade
                </button>
                <button className="flex-1 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm">
                  Drop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Swipe Indicators */}
      {swiping && (
        <>
          <div className={`absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-green-500/20 to-transparent flex items-center justify-center transition-opacity ${swiping.deltaX > 50 ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-green-400">START</span>
          </div>
          <div className={`absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-red-500/20 to-transparent flex items-center justify-center transition-opacity ${swiping.deltaX < -50 ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-red-400">BENCH</span>
          </div>
        </>
      )}
    </motion.div>
  );
};
```

## 5. Performance Optimization Strategy

### Bundle Optimization

```typescript
// next.config.js

module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion'
    ]
  },
  
  webpack: (config, { isServer }) => {
    // Code splitting for large components
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true
        },
        // Separate heavy libraries
        charts: {
          name: 'charts',
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          chunks: 'all',
          priority: 30
        },
        ml: {
          name: 'ml',
          test: /[\\/]services[\\/]ml[\\/]/,
          chunks: 'async',
          priority: 25
        }
      }
    };
    
    return config;
  }
};
```

### Lazy Loading Pattern

```typescript
// src/components/features/LazyOracle.tsx

const OracleInterface = dynamic(
  () => import('./oracle/OracleInterface').then(mod => mod.OracleInterface),
  {
    loading: () => <OracleSkeleton />,
    ssr: false // Disable SSR for heavy client components
  }
);

// Preload on hover
export const OracleButton: React.FC = () => {
  const [showOracle, setShowOracle] = useState(false);
  const preloaded = useRef(false);
  
  const handleMouseEnter = () => {
    if (!preloaded.current) {
      import('./oracle/OracleInterface');
      preloaded.current = true;
    }
  };
  
  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onClick={() => setShowOracle(true)}
        className="oracle-button"
      >
        Open AI Oracle
      </button>
      
      {showOracle && <OracleInterface />}
    </>
  );
};
```

## 6. Testing Strategy

### ML Model Testing

```typescript
// src/__tests__/ml/predictionEngine.test.ts

describe('MLPredictionEngine', () => {
  let engine: MLPredictionEngine;
  
  beforeEach(() => {
    engine = new MLPredictionEngine();
  });
  
  describe('prediction accuracy', () => {
    it('should predict within 20% of actual for 80% of cases', async () => {
      const testData = await loadHistoricalData();
      const results = [];
      
      for (const data of testData) {
        const prediction = await engine.predictPlayerPerformance(
          data.playerId,
          data.week
        );
        
        const error = Math.abs(prediction.fantasyPoints.expected - data.actual);
        const percentError = (error / data.actual) * 100;
        
        results.push({
          predicted: prediction.fantasyPoints.expected,
          actual: data.actual,
          percentError
        });
      }
      
      const within20Percent = results.filter(r => r.percentError <= 20);
      const accuracy = within20Percent.length / results.length;
      
      expect(accuracy).toBeGreaterThanOrEqual(0.8);
    });
  });
  
  describe('confidence calibration', () => {
    it('should have higher confidence correlate with lower error', async () => {
      const predictions = await getTestPredictions();
      
      // Group by confidence buckets
      const buckets = groupByConfidence(predictions);
      
      // Verify error decreases with confidence
      let prevError = Infinity;
      for (const bucket of buckets) {
        const avgError = calculateAverageError(bucket);
        expect(avgError).toBeLessThan(prevError);
        prevError = avgError;
      }
    });
  });
});
```

## Implementation Timeline

### Week 1-2: Foundation
- Set up ML service architecture
- Implement basic prediction models
- Create WebSocket infrastructure
- Design mobile-responsive layouts

### Week 3-4: Core Features
- Build draft room with real-time updates
- Implement trade analyzer
- Create AI Oracle interface
- Add mobile gesture support

### Week 5-6: Enhancement
- Add ensemble ML models
- Implement auction draft
- Create advanced analytics
- Optimize bundle size

### Week 7-8: Polish & Testing
- Comprehensive testing
- Performance optimization
- Bug fixes
- Documentation

## Key Takeaways from AstralDraftv2

1. **Ensemble ML Models**: They use 5+ different models and combine predictions
2. **Real-time Architecture**: WebSocket-first design for all live features
3. **Mobile-First**: Every component has mobile-specific optimizations
4. **Glassmorphism Design**: Consistent visual language throughout
5. **Performance Focus**: 190KB bundle achieved through aggressive optimization
6. **Testing Coverage**: Every component has tests, including ML models
7. **Feature Engineering**: Extensive feature extraction for ML predictions
8. **PWA Implementation**: Full offline support with service workers

## Next Steps

1. Set up ML infrastructure (Python service or TensorFlow.js)
2. Implement WebSocket server with Socket.io
3. Create mobile-first component library
4. Build draft room MVP
5. Add trade analyzer
6. Implement AI Oracle interface
7. Optimize and test

---

*Technical implementation guide based on AstralDraftv2 architecture analysis*
*Created: December 8, 2024*