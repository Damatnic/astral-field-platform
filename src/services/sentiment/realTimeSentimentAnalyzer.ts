import { Claude35SonnetProvider } from '../ai/providers/claude35SonnetProvider';
import { GPT4oProvider } from '../ai/providers/gpt4oProvider';
import { db } from '../../db/database';

interface SentimentSource {
  type: 'twitter' | 'reddit' | 'news' | 'podcast' | 'beat_reporter';
  url?: string;
  apiKey?: string;
  isActive: boolean;
  updateFrequency: number; // minutes
  lastUpdate?: Date;
  rateLimitRemaining?: number;
}

interface SentimentData {
  id: string;
  source: string;
  sourceType: 'twitter' | 'reddit' | 'news' | 'podcast' | 'beat_reporter';
  content: string;
  author: string;
  authorVerified: boolean;
  authorFollowers: number;
  publishedAt: Date;
  playerMentions: string[];
  teamMentions: string[];
  rawSentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  sentimentScore: number; // -1 to 1
  confidence: number;
  fantasyRelevance: number; // 0-1
  urgency: 'low' | 'medium' | 'high' | 'critical';
  topics: string[];
  influenceScore: number;
  engagementMetrics: {
    likes?: number;
    shares?: number;
    comments?: number;
    upvotes?: number;
  };
}

interface SentimentAlert {
  alertType: 'injury_concern' | 'trade_rumor' | 'lineup_change' | 'performance_issue' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  player: string;
  team?: string;
  summary: string;
  supportingEvidence: SentimentData[];
  confidenceScore: number;
  timeWindow: string;
  actionRecommendation: string;
  expirationTime: Date;
}

interface TrendingTopic {
  topic: string;
  category: 'player' | 'team' | 'injury' | 'trade' | 'coaching' | 'general';
  mentionCount: number;
  sentimentTrend: 'improving' | 'declining' | 'stable' | 'volatile';
  averageSentiment: number;
  influenceScore: number;
  timeframe: '1h' | '4h' | '12h' | '24h';
  keyMessages: string[];
  topInfluencers: Array<{
    author: string;
    followers: number;
    verified: boolean;
    message: string;
  }>;
}

export class RealTimeSentimentAnalyzer {
  private claudeProvider: Claude35SonnetProvider;
  private gpt4oProvider: GPT4oProvider;
  private sources: Map<string, SentimentSource> = new Map();
  private isRunning = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    injury: { mentionThreshold: 5, sentimentThreshold: -0.6, timeWindow: 60 }, // 1 hour
    trade: { mentionThreshold: 3, sentimentThreshold: 0.1, timeWindow: 180 }, // 3 hours
    opportunity: { mentionThreshold: 8, sentimentThreshold: 0.7, timeWindow: 120 } // 2 hours
  };

  constructor() {
    this.claudeProvider = new Claude35SonnetProvider();
    this.gpt4oProvider = new GPT4oProvider();
    this.initializeSources();
  }

  private initializeSources() {
    // Configure sentiment analysis sources
    this.sources.set('twitter_api', {
      type: 'twitter',
      url: 'https://api.twitter.com/2',
      apiKey: process.env.TWITTER_API_KEY,
      isActive: !!process.env.TWITTER_API_KEY,
      updateFrequency: 5, // 5 minutes
      rateLimitRemaining: 300
    });

    this.sources.set('reddit_api', {
      type: 'reddit',
      url: 'https://www.reddit.com/r/fantasyfootball',
      isActive: true,
      updateFrequency: 10, // 10 minutes
      rateLimitRemaining: 60
    });

    this.sources.set('news_aggregator', {
      type: 'news',
      url: 'https://newsapi.org/v2',
      apiKey: process.env.NEWS_API_KEY,
      isActive: !!process.env.NEWS_API_KEY,
      updateFrequency: 15, // 15 minutes
      rateLimitRemaining: 100
    });

    this.sources.set('beat_reporters', {
      type: 'beat_reporter',
      isActive: true,
      updateFrequency: 3, // 3 minutes - most time sensitive
      rateLimitRemaining: 500
    });

    console.log(`Initialized ${Array.from(this.sources.values()).filter(s => s.isActive).length} active sentiment sources`);
  }

  async startRealTimeMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('Real-time sentiment monitoring already running');
      return;
    }

    console.log('Starting real-time sentiment monitoring...');
    this.isRunning = true;

    // Start monitoring cycle
    this.analysisInterval = setInterval(async () => {
      try {
        await this.runAnalysisCycle();
      } catch (error) {
        console.error('Sentiment analysis cycle error:', error);
      }
    }, 60000); // Run every minute

    // Initial analysis
    await this.runAnalysisCycle();
    
    console.log('Real-time sentiment monitoring started');
  }

  async stopRealTimeMonitoring(): Promise<void> {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.isRunning = false;
    console.log('Real-time sentiment monitoring stopped');
  }

  private async runAnalysisCycle(): Promise<void> {
    console.log('Running sentiment analysis cycle...');

    // Collect data from all active sources
    const newSentimentData: SentimentData[] = [];

    for (const [sourceId, source] of this.sources) {
      if (!source.isActive) continue;

      // Check if it's time to update this source
      const timeSinceUpdate = source.lastUpdate 
        ? (Date.now() - source.lastUpdate.getTime()) / (1000 * 60)
        : Infinity;

      if (timeSinceUpdate >= source.updateFrequency) {
        try {
          const data = await this.collectFromSource(sourceId, source);
          newSentimentData.push(...data);
          
          // Update last update time
          source.lastUpdate = new Date();
          this.sources.set(sourceId, source);
        } catch (error) {
          console.error(`Error collecting from ${sourceId}:`, error);
        }
      }
    }

    if (newSentimentData.length === 0) {
      console.log('No new sentiment data to process');
      return;
    }

    // Analyze sentiment for new data
    const analyzedData = await this.analyzeSentimentBatch(newSentimentData);

    // Store analyzed data
    await this.storeSentimentData(analyzedData);

    // Generate alerts
    const alerts = await this.generateAlerts(analyzedData);
    
    if (alerts.length > 0) {
      await this.processAlerts(alerts);
    }

    // Update trending topics
    await this.updateTrendingTopics();

    console.log(`Analysis cycle completed: ${analyzedData.length} items processed, ${alerts.length} alerts generated`);
  }

  private async collectFromSource(sourceId: string, source: SentimentSource): Promise<SentimentData[]> {
    const collectedData: SentimentData[] = [];

    switch (source.type) {
      case 'twitter':
        collectedData.push(...await this.collectFromTwitter(source));
        break;
      case 'reddit':
        collectedData.push(...await this.collectFromReddit(source));
        break;
      case 'news':
        collectedData.push(...await this.collectFromNews(source));
        break;
      case 'beat_reporter':
        collectedData.push(...await this.collectFromBeatReporters(source));
        break;
    }

    return collectedData;
  }

  private async collectFromTwitter(source: SentimentSource): Promise<SentimentData[]> {
    if (!source.apiKey) return [];

    try {
      // In a real implementation, this would use the Twitter API v2
      // For this example, we'll simulate data collection
      const mockTweets = await this.getMockTwitterData();
      
      return mockTweets.map(tweet => ({
        id: `twitter_${tweet.id}`,
        source: 'twitter',
        sourceType: 'twitter' as const,
        content: tweet.text,
        author: tweet.author.username,
        authorVerified: tweet.author.verified,
        authorFollowers: tweet.author.followers_count,
        publishedAt: new Date(tweet.created_at),
        playerMentions: this.extractPlayerMentions(tweet.text),
        teamMentions: this.extractTeamMentions(tweet.text),
        rawSentiment: 'neutral' as const,
        sentimentScore: 0,
        confidence: 0,
        fantasyRelevance: 0,
        urgency: 'low' as const,
        topics: [],
        influenceScore: this.calculateInfluenceScore(tweet.author),
        engagementMetrics: {
          likes: tweet.public_metrics.like_count,
          shares: tweet.public_metrics.retweet_count,
          comments: tweet.public_metrics.reply_count
        }
      }));
    } catch (error) {
      console.error('Twitter collection error:', error);
      return [];
    }
  }

  private async collectFromReddit(source: SentimentSource): Promise<SentimentData[]> {
    try {
      // Simulate Reddit data collection
      const mockPosts = await this.getMockRedditData();
      
      return mockPosts.map(post => ({
        id: `reddit_${post.id}`,
        source: 'reddit',
        sourceType: 'reddit' as const,
        content: post.title + ' ' + (post.selftext || ''),
        author: post.author,
        authorVerified: false,
        authorFollowers: 0,
        publishedAt: new Date(post.created_utc * 1000),
        playerMentions: this.extractPlayerMentions(post.title + ' ' + (post.selftext || '')),
        teamMentions: this.extractTeamMentions(post.title + ' ' + (post.selftext || '')),
        rawSentiment: 'neutral' as const,
        sentimentScore: 0,
        confidence: 0,
        fantasyRelevance: 0,
        urgency: 'low' as const,
        topics: [],
        influenceScore: Math.min(post.score / 1000, 1.0),
        engagementMetrics: {
          upvotes: post.ups,
          comments: post.num_comments
        }
      }));
    } catch (error) {
      console.error('Reddit collection error:', error);
      return [];
    }
  }

  private async collectFromNews(source: SentimentSource): Promise<SentimentData[]> {
    if (!source.apiKey) return [];

    try {
      // Simulate news data collection
      const mockArticles = await this.getMockNewsData();
      
      return mockArticles.map(article => ({
        id: `news_${article.url}`,
        source: article.source.name,
        sourceType: 'news' as const,
        content: article.title + ' ' + (article.description || ''),
        author: article.author || article.source.name,
        authorVerified: true,
        authorFollowers: this.getSourceFollowers(article.source.name),
        publishedAt: new Date(article.publishedAt),
        playerMentions: this.extractPlayerMentions(article.title + ' ' + (article.description || '')),
        teamMentions: this.extractTeamMentions(article.title + ' ' + (article.description || '')),
        rawSentiment: 'neutral' as const,
        sentimentScore: 0,
        confidence: 0,
        fantasyRelevance: 0,
        urgency: 'medium' as const,
        topics: [],
        influenceScore: this.getSourceInfluence(article.source.name),
        engagementMetrics: {}
      }));
    } catch (error) {
      console.error('News collection error:', error);
      return [];
    }
  }

  private async collectFromBeatReporters(source: SentimentSource): Promise<SentimentData[]> {
    try {
      // Simulate beat reporter data collection
      const mockReports = await this.getMockBeatReporterData();
      
      return mockReports.map(report => ({
        id: `beat_${report.id}`,
        source: 'beat_reporter',
        sourceType: 'beat_reporter' as const,
        content: report.content,
        author: report.reporter,
        authorVerified: true,
        authorFollowers: report.followers,
        publishedAt: new Date(report.timestamp),
        playerMentions: this.extractPlayerMentions(report.content),
        teamMentions: this.extractTeamMentions(report.content),
        rawSentiment: 'neutral' as const,
        sentimentScore: 0,
        confidence: 0,
        fantasyRelevance: 0.8, // Beat reporters typically have high fantasy relevance
        urgency: 'high' as const,
        topics: [],
        influenceScore: 0.9, // Beat reporters have high influence
        engagementMetrics: {}
      }));
    } catch (error) {
      console.error('Beat reporter collection error:', error);
      return [];
    }
  }

  private async analyzeSentimentBatch(data: SentimentData[]): Promise<SentimentData[]> {
    console.log(`Analyzing sentiment for ${data.length} items...`);
    
    const batchSize = 10;
    const analyzedData: SentimentData[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(item => this.analyzeSingleSentiment(item))
        );
        
        analyzedData.push(...batchResults);
      } catch (error) {
        console.error('Batch sentiment analysis error:', error);
        // Add unanalyzed items with default values
        analyzedData.push(...batch.map(item => ({
          ...item,
          rawSentiment: 'neutral' as const,
          sentimentScore: 0,
          confidence: 0.5,
          fantasyRelevance: 0.3
        })));
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return analyzedData;
  }

  private async analyzeSingleSentiment(item: SentimentData): Promise<SentimentData> {
    const analysisPrompt = `
Analyze the sentiment and fantasy football relevance of this social media content:

Source: ${item.source}
Author: ${item.author} (${item.authorVerified ? 'verified' : 'unverified'}, ${item.authorFollowers} followers)
Content: "${item.content}"
Player mentions: ${item.playerMentions.join(', ') || 'None'}
Team mentions: ${item.teamMentions.join(', ') || 'None'}

Analyze and provide:
1. Overall sentiment: very_negative, negative, neutral, positive, or very_positive
2. Sentiment score: -1.0 to 1.0 (numerical)
3. Fantasy football relevance: 0.0 to 1.0 (how relevant is this to fantasy)
4. Confidence in analysis: 0.0 to 1.0
5. Urgency level: low, medium, high, or critical
6. Key topics mentioned (up to 5): injury, trade, performance, coaching, lineup, etc.

Consider:
- Injury reports and concerns
- Trade rumors and speculation
- Performance discussions
- Coaching decisions
- Lineup changes
- Contract situations

Format as JSON:
{
  "sentiment": "sentiment_value",
  "sentimentScore": numeric_score,
  "fantasyRelevance": numeric_relevance,
  "confidence": numeric_confidence,
  "urgency": "urgency_level",
  "topics": ["topic1", "topic2", ...],
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.claudeProvider.makeRequest({
        prompt: analysisPrompt,
        taskType: 'sentiment_analysis',
        maxTokens: 1000,
        temperature: 0.3
      });

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          ...item,
          rawSentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          confidence: analysis.confidence,
          fantasyRelevance: analysis.fantasyRelevance,
          urgency: analysis.urgency,
          topics: analysis.topics || []
        };
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
    }

    // Return item with default analysis if parsing fails
    return {
      ...item,
      rawSentiment: 'neutral',
      sentimentScore: 0,
      confidence: 0.5,
      fantasyRelevance: item.playerMentions.length > 0 ? 0.6 : 0.3,
      urgency: 'low',
      topics: []
    };
  }

  private async generateAlerts(data: SentimentData[]): Promise<SentimentAlert[]> {
    const alerts: SentimentAlert[] = [];
    const playerGroups = this.groupByPlayer(data);

    for (const [player, playerData] of playerGroups) {
      // Injury concern alerts
      const injuryMentions = playerData.filter(d => 
        d.topics.includes('injury') || 
        d.content.toLowerCase().includes('injured') ||
        d.content.toLowerCase().includes('hurt')
      );

      if (injuryMentions.length >= this.alertThresholds.injury.mentionThreshold) {
        const avgSentiment = injuryMentions.reduce((sum, d) => sum + d.sentimentScore, 0) / injuryMentions.length;
        
        if (avgSentiment <= this.alertThresholds.injury.sentimentThreshold) {
          alerts.push({
            alertType: 'injury_concern',
            severity: avgSentiment < -0.8 ? 'critical' : 'high',
            player,
            summary: `Multiple injury concerns reported for ${player}`,
            supportingEvidence: injuryMentions.slice(0, 5),
            confidenceScore: Math.min(injuryMentions.length / 10, 1.0),
            timeWindow: `${this.alertThresholds.injury.timeWindow}min`,
            actionRecommendation: 'Monitor closely, consider backup options',
            expirationTime: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
          });
        }
      }

      // Trade rumor alerts
      const tradeMentions = playerData.filter(d => 
        d.topics.includes('trade') ||
        d.content.toLowerCase().includes('trade')
      );

      if (tradeMentions.length >= this.alertThresholds.trade.mentionThreshold) {
        alerts.push({
          alertType: 'trade_rumor',
          severity: tradeMentions.length > 8 ? 'high' : 'medium',
          player,
          summary: `Trade rumors circulating for ${player}`,
          supportingEvidence: tradeMentions.slice(0, 3),
          confidenceScore: tradeMentions.filter(d => d.authorVerified).length / tradeMentions.length,
          timeWindow: `${this.alertThresholds.trade.timeWindow}min`,
          actionRecommendation: 'Evaluate trade value, monitor for confirmation',
          expirationTime: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
        });
      }

      // Positive opportunity alerts
      const positiveData = playerData.filter(d => d.sentimentScore > 0.5);
      if (positiveData.length >= this.alertThresholds.opportunity.mentionThreshold) {
        const avgSentiment = positiveData.reduce((sum, d) => sum + d.sentimentScore, 0) / positiveData.length;
        
        if (avgSentiment >= this.alertThresholds.opportunity.sentimentThreshold) {
          alerts.push({
            alertType: 'opportunity',
            severity: avgSentiment > 0.8 ? 'high' : 'medium',
            player,
            summary: `Strong positive sentiment for ${player}`,
            supportingEvidence: positiveData.slice(0, 3),
            confidenceScore: avgSentiment,
            timeWindow: `${this.alertThresholds.opportunity.timeWindow}min`,
            actionRecommendation: 'Consider acquiring, evaluate matchup advantages',
            expirationTime: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
          });
        }
      }
    }

    return alerts;
  }

  private groupByPlayer(data: SentimentData[]): Map<string, SentimentData[]> {
    const groups = new Map<string, SentimentData[]>();
    
    for (const item of data) {
      for (const player of item.playerMentions) {
        if (!groups.has(player)) {
          groups.set(player, []);
        }
        groups.get(player)!.push(item);
      }
    }
    
    return groups;
  }

  private async processAlerts(alerts: SentimentAlert[]): Promise<void> {
    console.log(`Processing ${alerts.length} sentiment alerts`);
    
    for (const alert of alerts) {
      try {
        // Store alert in database
        await db.query(`
          INSERT INTO sentiment_alerts (
            alert_type, severity, player_name, team_name, summary,
            supporting_evidence, confidence_score, time_window,
            action_recommendation, expires_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, [
          alert.alertType,
          alert.severity,
          alert.player,
          alert.team,
          alert.summary,
          JSON.stringify(alert.supportingEvidence),
          alert.confidenceScore,
          alert.timeWindow,
          alert.actionRecommendation,
          alert.expirationTime
        ]);

        // Send real-time notifications (would integrate with WebSocket/push notifications)
        console.log(`🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.summary}`);
        
      } catch (error) {
        console.error('Error processing alert:', error);
      }
    }
  }

  private async storeSentimentData(data: SentimentData[]): Promise<void> {
    for (const item of data) {
      try {
        await db.query(`
          INSERT INTO real_time_sentiment (
            external_id, source, source_type, content, author,
            author_verified, author_followers, published_at,
            player_mentions, team_mentions, raw_sentiment,
            sentiment_score, confidence, fantasy_relevance,
            urgency, topics, influence_score, engagement_metrics,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
          ON CONFLICT (external_id) DO NOTHING
        `, [
          item.id,
          item.source,
          item.sourceType,
          item.content,
          item.author,
          item.authorVerified,
          item.authorFollowers,
          item.publishedAt,
          JSON.stringify(item.playerMentions),
          JSON.stringify(item.teamMentions),
          item.rawSentiment,
          item.sentimentScore,
          item.confidence,
          item.fantasyRelevance,
          item.urgency,
          JSON.stringify(item.topics),
          item.influenceScore,
          JSON.stringify(item.engagementMetrics)
        ]);
      } catch (error) {
        console.error('Error storing sentiment data:', error);
      }
    }
  }

  private async updateTrendingTopics(): Promise<void> {
    // Update trending topics based on recent sentiment data
    const trendingQuery = `
      SELECT 
        unnest(string_to_array(array_to_string(topics, ','), ',')) as topic,
        COUNT(*) as mention_count,
        AVG(sentiment_score) as avg_sentiment,
        AVG(influence_score) as avg_influence
      FROM real_time_sentiment
      WHERE created_at > NOW() - INTERVAL '4 hours'
        AND topics != '[]'
      GROUP BY topic
      HAVING COUNT(*) >= 3
      ORDER BY mention_count DESC, avg_influence DESC
      LIMIT 20
    `;

    const trendingResult = await db.query(trendingQuery);
    
    for (const row of trendingResult.rows) {
      await db.query(`
        INSERT INTO trending_sentiment_topics (
          topic, mention_count, avg_sentiment, avg_influence,
          timeframe, last_updated
        ) VALUES ($1, $2, $3, $4, '4h', NOW())
        ON CONFLICT (topic, timeframe) DO UPDATE SET
          mention_count = $2,
          avg_sentiment = $3,
          avg_influence = $4,
          last_updated = NOW()
      `, [
        row.topic,
        parseInt(row.mention_count),
        parseFloat(row.avg_sentiment),
        parseFloat(row.avg_influence)
      ]);
    }
  }

  // Helper methods for data extraction and calculation

  private extractPlayerMentions(text: string): string[] {
    // In a real implementation, this would use a comprehensive player database
    // For now, we'll use common name patterns
    const playerPatterns = [
      /Josh Allen/gi, /Lamar Jackson/gi, /Patrick Mahomes/gi,
      /Christian McCaffrey/gi, /Derrick Henry/gi, /Austin Ekeler/gi,
      /Cooper Kupp/gi, /Davante Adams/gi, /Stefon Diggs/gi,
      /Travis Kelce/gi, /Mark Andrews/gi, /George Kittle/gi
    ];

    const mentions: string[] = [];
    playerPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        mentions.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(mentions)]; // Remove duplicates
  }

  private extractTeamMentions(text: string): string[] {
    const teamPatterns = [
      /Chiefs/gi, /Bills/gi, /Ravens/gi, /49ers/gi, /Eagles/gi,
      /Cowboys/gi, /Packers/gi, /Rams/gi, /Bengals/gi, /Chargers/gi
    ];

    const mentions: string[] = [];
    teamPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        mentions.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(mentions)];
  }

  private calculateInfluenceScore(author: any): number {
    let score = 0;
    
    // Follower count influence (logarithmic scale)
    if (author.followers_count) {
      score += Math.min(Math.log10(author.followers_count) / 7, 0.5);
    }
    
    // Verification bonus
    if (author.verified) {
      score += 0.3;
    }
    
    // Engagement rate (if available)
    if (author.public_metrics) {
      const engagementRate = (author.public_metrics.like_count + author.public_metrics.retweet_count) / 
                            Math.max(author.followers_count, 1);
      score += Math.min(engagementRate * 100, 0.2);
    }
    
    return Math.min(score, 1.0);
  }

  private getSourceFollowers(sourceName: string): number {
    const sourceFollowers = {
      'ESPN': 50000000,
      'NFL.com': 30000000,
      'The Athletic': 5000000,
      'ProFootballTalk': 2000000,
      'FantasyPros': 1000000
    };
    
    return sourceFollowers[sourceName] || 100000;
  }

  private getSourceInfluence(sourceName: string): number {
    const sourceInfluence = {
      'ESPN': 0.95,
      'NFL.com': 0.90,
      'The Athletic': 0.85,
      'ProFootballTalk': 0.80,
      'FantasyPros': 0.88
    };
    
    return sourceInfluence[sourceName] || 0.6;
  }

  // Mock data generators for testing (replace with real API calls)

  private async getMockTwitterData(): Promise<any[]> {
    return [
      {
        id: '1234567890',
        text: 'Josh Allen looking questionable for Sunday with that ankle injury. Keep an eye on this situation #Bills',
        author: { username: 'BillsBeatWriter', verified: true, followers_count: 50000 },
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 45, retweet_count: 12, reply_count: 8 }
      },
      {
        id: '1234567891',
        text: 'Christian McCaffrey absolutely dominating in practice today. Looks 100% healthy 💪',
        author: { username: 'NinersInsider', verified: true, followers_count: 75000 },
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 120, retweet_count: 35, reply_count: 15 }
      }
    ];
  }

  private async getMockRedditData(): Promise<any[]> {
    return [
      {
        id: 'abc123',
        title: 'Is Cooper Kupp a must-start this week?',
        selftext: 'Wondering if I should start Kupp over my other WRs this week...',
        author: 'fantasy_guru_99',
        created_utc: Math.floor(Date.now() / 1000),
        score: 150,
        ups: 150,
        num_comments: 25
      }
    ];
  }

  private async getMockNewsData(): Promise<any[]> {
    return [
      {
        url: 'https://espn.com/nfl/story/123',
        title: 'Patrick Mahomes Expected to Play Despite Knee Concern',
        description: 'Sources indicate the Chiefs QB will start Sunday despite minor knee issue.',
        author: 'Adam Schefter',
        source: { name: 'ESPN' },
        publishedAt: new Date().toISOString()
      }
    ];
  }

  private async getMockBeatReporterData(): Promise<any[]> {
    return [
      {
        id: 'beat123',
        content: 'Derrick Henry listed as questionable on injury report, but expect him to play Sunday',
        reporter: 'Paul Kuharsky',
        followers: 25000,
        timestamp: Date.now()
      }
    ];
  }

  // Public API methods

  async getCurrentSentimentTrends(): Promise<{
    trending: TrendingTopic[];
    alerts: SentimentAlert[];
    recentActivity: number;
  }> {
    const trendingQuery = await db.query(`
      SELECT * FROM trending_sentiment_topics
      WHERE timeframe = '4h'
      ORDER BY mention_count DESC
      LIMIT 10
    `);

    const alertsQuery = await db.query(`
      SELECT * FROM sentiment_alerts
      WHERE expires_at > NOW()
        AND created_at > NOW() - INTERVAL '2 hours'
      ORDER BY severity DESC, created_at DESC
      LIMIT 20
    `);

    const activityQuery = await db.query(`
      SELECT COUNT(*) as recent_count
      FROM real_time_sentiment
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);

    return {
      trending: trendingQuery.rows.map(row => ({
        topic: row.topic,
        category: 'general', // Would be determined by analysis
        mentionCount: row.mention_count,
        sentimentTrend: 'stable', // Would be calculated
        averageSentiment: parseFloat(row.avg_sentiment),
        influenceScore: parseFloat(row.avg_influence),
        timeframe: '4h',
        keyMessages: [],
        topInfluencers: []
      })),
      alerts: alertsQuery.rows.map(row => ({
        alertType: row.alert_type,
        severity: row.severity,
        player: row.player_name,
        team: row.team_name,
        summary: row.summary,
        supportingEvidence: JSON.parse(row.supporting_evidence),
        confidenceScore: parseFloat(row.confidence_score),
        timeWindow: row.time_window,
        actionRecommendation: row.action_recommendation,
        expirationTime: new Date(row.expires_at)
      })),
      recentActivity: parseInt(activityQuery.rows[0]?.recent_count || '0')
    };
  }

  async getPlayerSentimentSummary(playerName: string, hours: number = 24): Promise<{
    player: string;
    overallSentiment: number;
    sentimentTrend: string;
    mentionCount: number;
    topSources: string[];
    keyTopics: string[];
    alerts: SentimentAlert[];
  }> {
    const summaryQuery = await db.query(`
      SELECT 
        COUNT(*) as mention_count,
        AVG(sentiment_score) as avg_sentiment,
        array_agg(DISTINCT source) as sources,
        string_agg(DISTINCT unnest(topics), ',') as all_topics
      FROM real_time_sentiment
      WHERE $1 = ANY(string_to_array(player_mentions::text, ','))
        AND created_at > NOW() - INTERVAL '${hours} hours'
    `, [playerName]);

    const alertsQuery = await db.query(`
      SELECT * FROM sentiment_alerts
      WHERE player_name = $1
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `, [playerName]);

    const summary = summaryQuery.rows[0];

    return {
      player: playerName,
      overallSentiment: parseFloat(summary?.avg_sentiment || '0'),
      sentimentTrend: 'stable', // Would calculate trend
      mentionCount: parseInt(summary?.mention_count || '0'),
      topSources: summary?.sources || [],
      keyTopics: summary?.all_topics ? summary.all_topics.split(',').filter(t => t) : [],
      alerts: alertsQuery.rows.map(row => ({
        alertType: row.alert_type,
        severity: row.severity,
        player: row.player_name,
        team: row.team_name,
        summary: row.summary,
        supportingEvidence: JSON.parse(row.supporting_evidence),
        confidenceScore: parseFloat(row.confidence_score),
        timeWindow: row.time_window,
        actionRecommendation: row.action_recommendation,
        expirationTime: new Date(row.expires_at)
      }))
    };
  }
}