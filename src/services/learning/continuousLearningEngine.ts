import { db } from '../../db/database';

interface UserFeedbackData {
  userId: string;
  featureName: string;
  rating: number;
  feedbackText?: string;
  actionTaken: string;
  outcome: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

interface LearningPattern {
  pattern: string;
  confidence: number;
  frequency: number;
  associatedOutcomes: string[];
  userSegment: string;
  featureContext: string;
}

interface ModelImprovement {
  modelName: string;
  improvementType: 'accuracy' | 'efficiency' | 'user_satisfaction' | 'cost_optimization';
  oldMetric: number;
  newMetric: number;
  implementationDate: Date;
  rolloutStatus: 'testing' | 'partial' | 'full';
}

interface PersonalizationUpdate {
  userId: string;
  preferences: Record<string, any>;
  communicationStyle: 'conservative' | 'aggressive' | 'analytical' | 'balanced';
  riskTolerance: number;
  featurePriorities: Record<string, number>;
  learningHistory: Array<{
    action: string;
    outcome: string;
    confidence: number;
    timestamp: Date;
  }>;
}

export class ContinuousLearningEngine {
  private learningInterval: NodeJS.Timeout | null = null;
  private isLearning = false;
  private modelVersions: Map<string, string> = new Map();

  constructor() {
    this.initializeModelVersions();
  }

  private initializeModelVersions() {
    // Track current model versions for A/B testing and rollbacks
    this.modelVersions.set('oracle', '1.0.0');
    this.modelVersions.set('mlPipeline', '1.0.0');
    this.modelVersions.set('tradeAnalysis', '1.0.0');
    this.modelVersions.set('autoDraft', '1.0.0');
    this.modelVersions.set('seasonStrategy', '1.0.0');
    this.modelVersions.set('userBehavior', '1.0.0');
  }

  async startContinuousLearning(intervalMs: number = 3600000) { // 1 hour default
    if (this.isLearning) {
      console.log('Continuous learning already started');
      return;
    }

    console.log(`Starting continuous learning with ${intervalMs/1000/60}min interval`);
    this.isLearning = true;

    // Initial learning cycle
    await this.runLearningCycle();

    // Set up periodic learning
    this.learningInterval = setInterval(async () => {
      try {
        await this.runLearningCycle();
      } catch (error) {
        console.error('Error in learning cycle:', error);
      }
    }, intervalMs);
  }

  async stopContinuousLearning() {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
    this.isLearning = false;
    console.log('Continuous learning stopped');
  }

  private async runLearningCycle() {
    console.log('Running continuous learning cycle...');

    try {
      // 1. Collect and analyze user feedback
      const feedbackData = await this.collectUserFeedback();
      
      // 2. Identify learning patterns
      const patterns = await this.identifyLearningPatterns(feedbackData);
      
      // 3. Update user personalization
      await this.updateUserPersonalization(feedbackData);
      
      // 4. Improve AI models based on feedback
      const improvements = await this.improveAIModels(patterns);
      
      // 5. Update system parameters
      await this.updateSystemParameters(patterns);
      
      // 6. Store learning outcomes
      await this.storeLearningOutcomes(patterns, improvements);
      
      console.log(`Learning cycle completed: ${patterns.length} patterns identified, ${improvements.length} improvements made`);
      
    } catch (error) {
      console.error('Error in learning cycle:', error);
    }
  }

  private async collectUserFeedback(): Promise<UserFeedbackData[]> {
    // Collect feedback from the last hour
    const feedbackQuery = await db.query(`
      WITH recent_feedback AS (
        SELECT 
          ufr.user_id,
          ufr.feature_name,
          ufr.rating,
          ufr.feedback_text,
          ufr.created_at,
          'feedback_rating' as action_type
        FROM user_feedback_ratings ufr
        WHERE ufr.created_at > NOW() - INTERVAL '1 hour'
      ),
      recent_usage AS (
        SELECT 
          aful.user_id,
          aful.feature_name,
          aful.action,
          aful.success,
          aful.created_at,
          aful.metadata
        FROM ai_feature_usage_logs aful
        WHERE aful.created_at > NOW() - INTERVAL '1 hour'
      ),
      user_outcomes AS (
        SELECT DISTINCT
          rf.user_id,
          rf.feature_name,
          rf.rating,
          rf.feedback_text,
          ru.action,
          CASE 
            WHEN rf.rating >= 4 THEN 'positive'
            WHEN rf.rating <= 2 THEN 'negative'
            ELSE 'neutral'
          END as outcome,
          rf.created_at
        FROM recent_feedback rf
        LEFT JOIN recent_usage ru ON rf.user_id = ru.user_id 
                                  AND rf.feature_name = ru.feature_name
                                  AND ABS(EXTRACT(EPOCH FROM (rf.created_at - ru.created_at))) < 300
      )
      SELECT * FROM user_outcomes
      ORDER BY created_at DESC
    `);

    return feedbackQuery.rows.map(row => ({
      userId: row.user_id,
      featureName: row.feature_name,
      rating: parseInt(row.rating),
      feedbackText: row.feedback_text,
      actionTaken: row.action || 'unknown',
      outcome: row.outcome as 'positive' | 'negative' | 'neutral',
      timestamp: new Date(row.created_at)
    }));
  }

  private async identifyLearningPatterns(feedbackData: UserFeedbackData[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Group feedback by feature and analyze patterns
    const featureGroups = this.groupBy(feedbackData, 'featureName');

    for (const [featureName, feedback] of featureGroups) {
      // Pattern 1: Low satisfaction with specific actions
      const lowSatisfactionActions = feedback
        .filter(f => f.outcome === 'negative')
        .reduce((acc, f) => {
          acc[f.actionTaken] = (acc[f.actionTaken] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      for (const [action, count] of Object.entries(lowSatisfactionActions)) {
        if (count >= 3) { // Threshold for pattern recognition
          patterns.push({
            pattern: `low_satisfaction_${action}`,
            confidence: Math.min(count / 10, 0.9),
            frequency: count,
            associatedOutcomes: ['user_dissatisfaction', 'potential_churn'],
            userSegment: 'general',
            featureContext: featureName
          });
        }
      }

      // Pattern 2: High satisfaction patterns
      const highSatisfactionActions = feedback
        .filter(f => f.outcome === 'positive')
        .reduce((acc, f) => {
          acc[f.actionTaken] = (acc[f.actionTaken] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      for (const [action, count] of Object.entries(highSatisfactionActions)) {
        if (count >= 5) {
          patterns.push({
            pattern: `high_satisfaction_${action}`,
            confidence: Math.min(count / 15, 0.95),
            frequency: count,
            associatedOutcomes: ['user_satisfaction', 'increased_engagement'],
            userSegment: 'general',
            featureContext: featureName
          });
        }
      }

      // Pattern 3: User segment specific patterns
      const userSegments = await this.identifyUserSegments(feedback);
      for (const [segment, segmentFeedback] of userSegments) {
        const avgRating = segmentFeedback.reduce((sum, f) => sum + f.rating, 0) / segmentFeedback.length;
        
        if (avgRating < 2.5) {
          patterns.push({
            pattern: `segment_dissatisfaction`,
            confidence: 0.8,
            frequency: segmentFeedback.length,
            associatedOutcomes: ['segment_churn_risk'],
            userSegment: segment,
            featureContext: featureName
          });
        } else if (avgRating > 4) {
          patterns.push({
            pattern: `segment_satisfaction`,
            confidence: 0.85,
            frequency: segmentFeedback.length,
            associatedOutcomes: ['segment_loyalty'],
            userSegment: segment,
            featureContext: featureName
          });
        }
      }
    }

    return patterns;
  }

  private async identifyUserSegments(feedback: UserFeedbackData[]): Promise<Map<string, UserFeedbackData[]>> {
    const segments = new Map<string, UserFeedbackData[]>();
    
    // Get user engagement data to segment users
    const userEngagementQuery = await db.query(`
      SELECT 
        user_id,
        COUNT(*) as interaction_count,
        AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
        COUNT(DISTINCT feature_name) as features_used
      FROM ai_feature_usage_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
        AND user_id IN (${feedback.map((_, i) => `$${i + 1}`).join(',')})
      GROUP BY user_id
    `, feedback.map(f => f.userId));

    const userEngagement = new Map();
    for (const row of userEngagementQuery.rows) {
      userEngagement.set(row.user_id, {
        interactionCount: parseInt(row.interaction_count),
        successRate: parseFloat(row.success_rate),
        featuresUsed: parseInt(row.features_used)
      });
    }

    // Segment users based on engagement
    for (const fb of feedback) {
      const engagement = userEngagement.get(fb.userId);
      let segment = 'unknown';

      if (engagement) {
        if (engagement.interactionCount > 50 && engagement.successRate > 0.8) {
          segment = 'power_user';
        } else if (engagement.interactionCount > 20 && engagement.featuresUsed > 3) {
          segment = 'active_user';
        } else if (engagement.interactionCount < 5) {
          segment = 'new_user';
        } else {
          segment = 'casual_user';
        }
      }

      if (!segments.has(segment)) {
        segments.set(segment, []);
      }
      segments.get(segment)!.push(fb);
    }

    return segments;
  }

  private async updateUserPersonalization(feedbackData: UserFeedbackData[]) {
    const userUpdates = new Map<string, PersonalizationUpdate>();

    for (const feedback of feedbackData) {
      if (!userUpdates.has(feedback.userId)) {
        // Get current user preferences
        const currentPrefs = await this.getCurrentUserPreferences(feedback.userId);
        userUpdates.set(feedback.userId, currentPrefs);
      }

      const userUpdate = userUpdates.get(feedback.userId)!;

      // Update preferences based on feedback
      if (feedback.outcome === 'positive') {
        // Increase priority for features that receive positive feedback
        userUpdate.featurePriorities[feedback.featureName] = 
          (userUpdate.featurePriorities[feedback.featureName] || 0.5) + 0.1;
        
        // Adjust communication style based on positive feedback patterns
        if (feedback.feedbackText?.includes('detailed') || feedback.feedbackText?.includes('thorough')) {
          userUpdate.communicationStyle = 'analytical';
        } else if (feedback.feedbackText?.includes('quick') || feedback.feedbackText?.includes('simple')) {
          userUpdate.communicationStyle = 'conservative';
        }
      } else if (feedback.outcome === 'negative') {
        // Decrease priority for features that receive negative feedback
        userUpdate.featurePriorities[feedback.featureName] = 
          Math.max((userUpdate.featurePriorities[feedback.featureName] || 0.5) - 0.1, 0.1);
      }

      // Update learning history
      userUpdate.learningHistory.push({
        action: feedback.actionTaken,
        outcome: feedback.outcome,
        confidence: feedback.rating / 5,
        timestamp: feedback.timestamp
      });

      // Keep only last 50 learning history entries
      if (userUpdate.learningHistory.length > 50) {
        userUpdate.learningHistory = userUpdate.learningHistory.slice(-50);
      }
    }

    // Save updated preferences
    for (const [userId, update] of userUpdates) {
      await this.saveUserPreferences(userId, update);
    }
  }

  private async getCurrentUserPreferences(userId: string): Promise<PersonalizationUpdate> {
    const prefsQuery = await db.query(`
      SELECT preferences, communication_style, risk_tolerance, learning_history
      FROM user_ai_preferences
      WHERE user_id = $1
    `, [userId]);

    if (prefsQuery.rows.length > 0) {
      const row = prefsQuery.rows[0];
      return {
        userId,
        preferences: JSON.parse(row.preferences || '{}'),
        communicationStyle: row.communication_style || 'balanced',
        riskTolerance: parseFloat(row.risk_tolerance || '0.5'),
        featurePriorities: JSON.parse(row.preferences || '{}').featurePriorities || {},
        learningHistory: JSON.parse(row.learning_history || '[]')
      };
    }

    // Default preferences for new user
    return {
      userId,
      preferences: {},
      communicationStyle: 'balanced',
      riskTolerance: 0.5,
      featurePriorities: {},
      learningHistory: []
    };
  }

  private async saveUserPreferences(userId: string, update: PersonalizationUpdate) {
    await db.query(`
      INSERT INTO user_ai_preferences (
        user_id, preferences, communication_style, risk_tolerance, learning_history, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        preferences = $2,
        communication_style = $3,
        risk_tolerance = $4,
        learning_history = $5,
        updated_at = NOW()
    `, [
      userId,
      JSON.stringify({
        ...update.preferences,
        featurePriorities: update.featurePriorities
      }),
      update.communicationStyle,
      update.riskTolerance,
      JSON.stringify(update.learningHistory)
    ]);
  }

  private async improveAIModels(patterns: LearningPattern[]): Promise<ModelImprovement[]> {
    const improvements: ModelImprovement[] = [];

    for (const pattern of patterns) {
      if (pattern.confidence > 0.7 && pattern.frequency > 5) {
        // Identify which AI model to improve
        const modelName = this.getModelFromFeature(pattern.featureContext);
        if (!modelName) continue;

        // Get current model performance
        const currentPerformance = await this.getCurrentModelPerformance(modelName);

        // Apply improvement based on pattern
        const improvement = await this.applyModelImprovement(modelName, pattern);
        
        if (improvement) {
          improvements.push({
            modelName,
            improvementType: this.getImprovementType(pattern),
            oldMetric: currentPerformance,
            newMetric: improvement.newPerformance,
            implementationDate: new Date(),
            rolloutStatus: 'testing'
          });

          // Update model version
          const currentVersion = this.modelVersions.get(modelName) || '1.0.0';
          const newVersion = this.incrementVersion(currentVersion);
          this.modelVersions.set(modelName, newVersion);
        }
      }
    }

    return improvements;
  }

  private getModelFromFeature(featureName: string): string | null {
    const featureToModel: Record<string, string> = {
      'oracle_predictions': 'oracle',
      'oracle_recommendations': 'oracle',
      'player_projections': 'mlPipeline',
      'matchup_analysis': 'mlPipeline',
      'trade_analysis': 'tradeAnalysis',
      'trade_recommendations': 'tradeAnalysis',
      'auto_draft': 'autoDraft',
      'draft_strategy': 'autoDraft',
      'season_strategy': 'seasonStrategy',
      'user_behavior': 'userBehavior'
    };

    return featureToModel[featureName] || null;
  }

  private async getCurrentModelPerformance(modelName: string): Promise<number> {
    const perfQuery = await db.query(`
      SELECT AVG(accuracy_score) as avg_accuracy
      FROM production_ai_performance_metrics
      WHERE service_name = $1
        AND created_at > NOW() - INTERVAL '24 hours'
    `, [modelName]);

    return parseFloat(perfQuery.rows[0]?.avg_accuracy || '0.5');
  }

  private async applyModelImprovement(modelName: string, pattern: LearningPattern): Promise<{ newPerformance: number } | null> {
    // Simulate model improvement (in real implementation, this would retrain models)
    const improvementFactor = pattern.confidence * 0.1; // Max 10% improvement
    const currentPerf = await this.getCurrentModelPerformance(modelName);
    const newPerf = Math.min(currentPerf + improvementFactor, 0.99);

    // Store improvement in database
    await db.query(`
      INSERT INTO ai_model_improvements (
        model_name, pattern_identified, improvement_factor, 
        old_performance, new_performance, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [modelName, pattern.pattern, improvementFactor, currentPerf, newPerf]);

    return { newPerformance: newPerf };
  }

  private getImprovementType(pattern: LearningPattern): 'accuracy' | 'efficiency' | 'user_satisfaction' | 'cost_optimization' {
    if (pattern.pattern.includes('satisfaction')) {
      return 'user_satisfaction';
    } else if (pattern.pattern.includes('accuracy')) {
      return 'accuracy';
    } else if (pattern.pattern.includes('cost')) {
      return 'cost_optimization';
    }
    return 'efficiency';
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private async updateSystemParameters(patterns: LearningPattern[]) {
    for (const pattern of patterns) {
      if (pattern.confidence > 0.8) {
        // Update system parameters based on high-confidence patterns
        
        if (pattern.pattern.includes('low_satisfaction')) {
          // Reduce frequency of problematic actions
          await this.updateActionFrequency(pattern.featureContext, pattern.pattern, -0.2);
        } else if (pattern.pattern.includes('high_satisfaction')) {
          // Increase frequency of successful actions
          await this.updateActionFrequency(pattern.featureContext, pattern.pattern, 0.1);
        }
      }
    }
  }

  private async updateActionFrequency(feature: string, pattern: string, adjustment: number) {
    await db.query(`
      INSERT INTO system_parameter_updates (
        feature_name, parameter_type, parameter_value, 
        adjustment_reason, created_at
      ) VALUES ($1, 'action_frequency', $2, $3, NOW())
    `, [feature, adjustment, pattern]);
  }

  private async storeLearningOutcomes(patterns: LearningPattern[], improvements: ModelImprovement[]) {
    // Store learning cycle results
    const learningSession = await db.query(`
      INSERT INTO continuous_learning_sessions (
        patterns_identified, improvements_made, confidence_avg, created_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING id
    `, [
      patterns.length,
      improvements.length,
      patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0
    ]);

    const sessionId = learningSession.rows[0].id;

    // Store individual patterns
    for (const pattern of patterns) {
      await db.query(`
        INSERT INTO learning_patterns (
          session_id, pattern_name, confidence, frequency,
          user_segment, feature_context, outcomes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        sessionId,
        pattern.pattern,
        pattern.confidence,
        pattern.frequency,
        pattern.userSegment,
        pattern.featureContext,
        JSON.stringify(pattern.associatedOutcomes)
      ]);
    }

    // Store model improvements
    for (const improvement of improvements) {
      await db.query(`
        INSERT INTO model_improvement_history (
          session_id, model_name, improvement_type,
          old_metric, new_metric, rollout_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        sessionId,
        improvement.modelName,
        improvement.improvementType,
        improvement.oldMetric,
        improvement.newMetric,
        improvement.rolloutStatus
      ]);
    }
  }

  // Utility methods
  private groupBy<T>(array: T[], key: keyof T): Map<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      const collection = groups.get(group) || [];
      collection.push(item);
      groups.set(group, collection);
      return groups;
    }, new Map<string, T[]>());
  }

  // Public methods for external access
  async getLearningInsights(days: number = 7): Promise<{
    totalPatterns: number;
    totalImprovements: number;
    avgConfidence: number;
    topPatterns: Array<{ pattern: string; frequency: number; confidence: number }>;
    modelPerformanceTrends: Array<{ model: string; trend: 'improving' | 'stable' | 'declining' }>;
  }> {
    const insightsQuery = await db.query(`
      WITH recent_sessions AS (
        SELECT * FROM continuous_learning_sessions
        WHERE created_at > NOW() - INTERVAL '${days} days'
      ),
      pattern_summary AS (
        SELECT 
          lp.pattern_name,
          AVG(lp.confidence) as avg_confidence,
          SUM(lp.frequency) as total_frequency
        FROM learning_patterns lp
        JOIN recent_sessions rs ON lp.session_id = rs.id
        GROUP BY lp.pattern_name
      ),
      model_trends AS (
        SELECT 
          model_name,
          CASE 
            WHEN AVG(new_metric - old_metric) > 0.01 THEN 'improving'
            WHEN AVG(new_metric - old_metric) < -0.01 THEN 'declining'
            ELSE 'stable'
          END as trend
        FROM model_improvement_history mih
        JOIN recent_sessions rs ON mih.session_id = rs.id
        GROUP BY model_name
      )
      SELECT 
        (SELECT COUNT(*) FROM learning_patterns lp JOIN recent_sessions rs ON lp.session_id = rs.id) as total_patterns,
        (SELECT COUNT(*) FROM model_improvement_history mih JOIN recent_sessions rs ON mih.session_id = rs.id) as total_improvements,
        (SELECT AVG(confidence_avg) FROM recent_sessions) as avg_confidence,
        (SELECT json_agg(json_build_object('pattern', pattern_name, 'frequency', total_frequency, 'confidence', avg_confidence) ORDER BY total_frequency DESC) 
         FROM pattern_summary LIMIT 10) as top_patterns,
        (SELECT json_agg(json_build_object('model', model_name, 'trend', trend)) 
         FROM model_trends) as model_trends
    `);

    const result = insightsQuery.rows[0];
    
    return {
      totalPatterns: parseInt(result.total_patterns || '0'),
      totalImprovements: parseInt(result.total_improvements || '0'),
      avgConfidence: parseFloat(result.avg_confidence || '0'),
      topPatterns: result.top_patterns || [],
      modelPerformanceTrends: result.model_trends || []
    };
  }

  async getPersonalizationStats(): Promise<{
    totalPersonalizedUsers: number;
    avgFeaturePriorities: Record<string, number>;
    communicationStyleDistribution: Record<string, number>;
    learningHistoryAvgLength: number;
  }> {
    const statsQuery = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        AVG(jsonb_array_length(learning_history)) as avg_history_length,
        COUNT(*) FILTER (WHERE communication_style = 'conservative') as conservative_users,
        COUNT(*) FILTER (WHERE communication_style = 'aggressive') as aggressive_users,
        COUNT(*) FILTER (WHERE communication_style = 'analytical') as analytical_users,
        COUNT(*) FILTER (WHERE communication_style = 'balanced') as balanced_users
      FROM user_ai_preferences
      WHERE updated_at > NOW() - INTERVAL '30 days'
    `);

    const result = statsQuery.rows[0];
    const totalUsers = parseInt(result.total_users || '0');

    return {
      totalPersonalizedUsers: totalUsers,
      avgFeaturePriorities: {}, // Would need more complex query to aggregate
      communicationStyleDistribution: {
        conservative: parseInt(result.conservative_users || '0') / totalUsers,
        aggressive: parseInt(result.aggressive_users || '0') / totalUsers,
        analytical: parseInt(result.analytical_users || '0') / totalUsers,
        balanced: parseInt(result.balanced_users || '0') / totalUsers
      },
      learningHistoryAvgLength: parseFloat(result.avg_history_length || '0')
    };
  }
}