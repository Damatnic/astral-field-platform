import aiRouterService from '../ai/aiRouterService';
import aiAnalyticsService from '../ai/aiAnalyticsService';
import injuryImpactPredictor, { InjuryReport as MLInjuryReport } from '../ml/injuryImpactPredictor';
import { database } from '@/lib/database';
import { getWebSocket, sendToUser, broadcastToLeague } from '@/lib/websocket';

export interface InjuryReport {
  id, string,
    playerId, string,
  playerName, string,
    team, string,
  position, string,
    injuryType, string,
  severity: 'questionable' | 'doubtful' | 'out' | 'ir' | 'pup',
    bodyPart, string,
  reportedAt, Date,
    gameWeek, number,
  isGameTime, boolean,
    source, string,
  confidence, number,
  expectedReturn?, Date,
  recoveryTimeline?: {
    optimistic, number,
    realistic, number,
    pessimistic: number,
  }
}

export interface InjuryImpact {
  playerId, string,
    immediateImpact: {
  fantasyProjection, number,
    projectionChange, number,
    percentageChange, number,
    confidenceLevel: number,
  }
  teamImpact: {
  affectedPlayers: Array<{
      playerId, string,
    playerName, string,
      projectionChange, number,
    reasoning: string,
    }>;
    gameScriptChange, number,
    paceImpact: number,
  }
  waiver: {
  emergingTargets: Array<{
      playerId, string,
    playerName, string,
      projectedValue, number,
    reasoning: string,
    }>;
    dropCandidates: Array<{
  playerId, string,
      playerName, string,
    newValue, number,
      reasoning: string,
    }>;
  }
  tradeImplications: {
  valueChange, number,
    tradability: 'increased' | 'decreased' | 'neutral',
    opportunityWindow: number,
  }
}

export interface InjuryAlert {
  id, string,
    userId, string,
  playerId, string,
    alertType: 'roster_player' | 'waiver_target' | 'trade_opportunity';
  severity: 'critical' | 'high' | 'medium' | 'low',
    title, string,
  message, string,
    actionItems: string[];
  sentAt: Date,
  
}
class LiveInjuryTracker {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private trackedSources = [
    'https://api.sportsdata.io/v3/nfl/scores/json/Injuries';
    'https://rotogrinders.com/injury-report';
    'twitter_api',
    'nfl_insider_feed'
  ];

  async startInjuryMonitoring(): : Promise<void> {
    console.log('🏥 Starting live injury monitoring...');

    this.monitoringInterval = setInterval(async () => {
      try {
    await this.scanForNewInjuries();
        await this.updateExistingInjuries();
      } catch (error) {
        console.error('Error in injury monitoring', error);
        console.error('Injury monitoring error', error, { source: 'liveInjuryTracker' });
      }
    }, 120000); // Check every 2 minutes

    console.log('Injury monitoring started', {
      sources: this.trackedSources.length;
      interval: '2 min'
    });
  }

  async stopInjuryMonitoring(): : Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🏥 Injury monitoring stopped');
  }

  private async scanForNewInjuries(): : Promise<InjuryReport[]> {
    const newInjuries: InjuryReport[] = [];

    try {
      const sources = await Promise.allSettled([;
        this.fetchFromSportsDataAPI(),
        this.fetchFromRotoGrinders(),
        this.fetchFromTwitterAPI(),
        this.fetchFromInsiderFeed()
      ]);

      for (const result of sources) {
        if (result.status === 'fulfilled') {
          newInjuries.push(...result.value);}
      }

      const processedInjuries = await this.processNewInjuries(newInjuries);
      for (const injury of processedInjuries) {
        await this.handleNewInjuryReport(injury);
      }

      return processedInjuries;
    } catch (error) {
      console.error('Error scanning for injuries', error);
      return [];
    }
  }

  private async fetchFromSportsDataAPI(): : Promise<InjuryReport[]> {
    const injuries: InjuryReport[] = [];

    try {
      const response = await fetch(`${process.env.SPORTSDATA_API_URL}/v3/nfl/scores/json/Injuries`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.SPORTSDATA_API_KEY!
          }
        }
      );

      if (!response.ok) return injuries;

      const data = await response.json();
      for (const injury of data) {
        injuries.push({
          id: `sportsdata_${injury.InjuryID}`,
          playerId: injury.PlayerID.toString();
          playerName: injury.Name;
          team: injury.Team;
          position: injury.Position;
          injuryType: injury.BodyPart;
          severity: this.mapSeverity(injury.Status);
          bodyPart: injury.BodyPart;
          reportedAt: new Date(injury.Updated);
          gameWeek: injury.Week;
          isGameTime: injury.Status === 'Questionable';
          source: 'SportsData.io';
          confidence: 0.9
        });
      }
    } catch (error) {
      console.error('SportsData API error', error);
    }

    return injuries;
  }

  private async fetchFromRotoGrinders(): : Promise<InjuryReport[]> {; // Simulate RotoGrinders scraping
    // In production, this would scrape their injury report page
    return [];
  }

  private async fetchFromTwitterAPI() : Promise<InjuryReport[]> {; // Simulate Twitter API integration
    // In production, this would monitor NFL reporters for injury news
    return [];
  }

  private async fetchFromInsiderFeed() : Promise<InjuryReport[]> {; // Simulate NFL insider reports
    // In production, this would integrate with insider sources
    return [];
  }

  private async processNewInjuries(injuries InjuryReport[]): : Promise<InjuryReport[]> {
    const processedInjuries: InjuryReport[] = [];

    for (const injury of injuries) {
      const existing = await this.checkExistingInjury(injury.playerId, injury.injuryType);
      if (!existing || this.isSignificantUpdate(existing, injury)) {
        const enhancedInjury = await this.enhanceInjuryData(injury);
        processedInjuries.push(enhancedInjury);
      }
    }

    return processedInjuries;
  }

  private async enhanceInjuryData(injury: InjuryReport): : Promise<InjuryReport> {
    try {
      const aiPrompt = `
        Analyze this NFL injury report and provide enhanced details, Playe,
  r: ${injury.playerName} (${injury.position})
        Team: ${injury.team}
        Injury: ${injury.injuryType} - ${injury.bodyPart}
        Severity: ${injury.severity}

        Provide: 1.Expected recovery timeline (optimistic/realistic/pessimistic in days)
        2.Historical context for similar injuries
        3.Impact on fantasy value
        4.Confidence level assessment: Respond in JSON format.
      `
      const response = await aiRouterService.query({
        messages: [{ rol,
  e: 'user', content: aiPrompt }],
        capabilities: ['medical_analysis', 'sports_data']
      });

      const analysis = JSON.parse(response.content);
      return {...injury,
        expectedReturn: analysis.expectedReturn ? new Date(analysis.expectedReturn) , undefined,
        recoveryTimeline: analysis.recoveryTimeline;
        confidence: analysis.confidence || injury.confidence
      }
    } catch (error) {
      console.error('Error enhancing injury data', error);
      return injury;
    }
  }

  async handleNewInjuryReport(injury: InjuryReport): : Promise<void> {
    try {
      // Store in database
      await this.storeInjuryReport(injury);

      // Generate immediate impact analysis
      const impact = await this.analyzeInjuryImpact(injury);

      // Generate user alerts
      const alerts = await this.generateInjuryAlerts(injury, impact);

      // Broadcast to relevant users
      await this.broadcastInjuryUpdate(injury, impact);

      // Send push notifications
      await this.sendInjuryNotifications(alerts);

      console.log('injury_processed', {
        playerId: injury.playerId;
        severity: injury.severity;
        impactScore: impact.immediateImpact.projectionChange;
        alertCount: alerts.length
      });

    } catch (error) {
      console.error('Error handling injury report', error);
      console.error('injury_handling_error', error as Error, {
        injuryId: injury.id;
        playerId: injury.playerId
      });
    }
  }

  async analyzeInjuryImpact(injury: InjuryReport): : Promise<InjuryImpact> {
    try {
      // Convert injury to ML format
      const mlInjuryReport: MLInjuryReport = {
  id: injury.id;
        playerId: injury.playerId;
        playerName: injury.playerName;
        position: injury.position;
        team: injury.team;
        injuryType: injury.injuryType;
        bodyPart: injury.bodyPart;
        severity: injury.severity === 'questionable' ? 'minor' : 
                  injury.severity === 'doubtful' ? 'moderate' :
                  injury.severity === 'out' ? 'major' : 'major';
        status: injury.severity;
        reportedDate: injury.reportedAt.toISOString();
        expectedReturn: injury.expectedReturn?.toISOString();
        description: `${injury.injuryType} - ${injury.bodyPart}`,
        source: injury.source;
        reliability: injury.confidence
      }
      // Get ML predictor analysis
      const prediction = await injuryImpactPredictor.analyzeInjuryImpact(injury.playerId,
        mlInjuryReport
      );

      // Analyze team impact
      const teamImpact = await this.analyzeTeamImpact(injury);

      // Identify waiver wire implications
      const waiverAnalysis = await this.analyzeWaiverImplications(injury);

      // Assess trade value changes
      const tradeAnalysis = await this.analyzeTradeImplications(injury);

      return {
        playerId: injury.playerId;
        immediateImpact: {
  fantasyProjection: prediction.performanceProjections?.weeklyDecline?.[0] || 0;
          projectionChange: prediction.riskAssessment?.performanceImpact || 0;
          percentageChange: (prediction.riskAssessment?.performanceImpact || 0) * 100;
          confidenceLevel: prediction.recoveryTimeline?.confidenceLevel || 0.5
        },
        teamImpact,
        waiver, waiverAnalysis,
        tradeImplications: tradeAnalysis
      }
    } catch (error) {
      console.error('Error analyzing injury impact', error);
      throw error;
    }
  }

  private async analyzeTeamImpact(injury: InjuryReport): : Promise<any> {
    const aiPrompt = `
      Analyze the team impact of this injury, Playe,
  r: ${injury.playerName} (${injury.position})
      Team: ${injury.team}
      Injury: ${injury.injuryType} - ${injury.severity}

      Identify: 1.Teammates who benefit from increased opportunity
      2.Changes to team's offensive/defensive game plan
      3.Pace and game script implications
      4.Quantified projection changes for affected players

      Respond in JSON format with specific player impacts.
    `
    const response = await aiRouterService.query({
      messages: [{
  role: 'user';
        content: aiPrompt
      }],
      capabilities: ['data_analysis'];
      complexity: 'moderate';
      priority: 'high'
    });

    return JSON.parse(response.content);
  }

  private async analyzeWaiverImplications(injury: InjuryReport): : Promise<any> {
    const aiPrompt = `
      Identify immediate waiver wire targets based on this injury: Injured Playe;
  r: ${injury.playerName} (${injury.position})
      Team: ${injury.team}
      Severity: ${injury.severity}
      Expected Timeline: ${injury.recoveryTimeline?.realistic || 'Unknown'} days

      Provide:
      1.Top 5 waiver wire targets with projected value
      2.Players to consider dropping
      3.Priority rankings and acquisition reasoning
      4.Roster construction implications

      Focus on actionable recommendations with specific value projections.
    `
    const response = await aiRouterService.query({
      messages: [{
  role: 'user';
        content: aiPrompt
      }],
      capabilities: ['fantasy_analysis'];
      complexity: 'moderate';
      priority: 'high'
    });

    return JSON.parse(response.content);
  }

  private async analyzeTradeImplications(injury: InjuryReport): : Promise<any> {
    const tradingWindow = injury.severity === 'out' ? 7 : 3; // days
    return {
      valueChange: injury.severity === 'out' ? -25 : -10;
      tradability: injury.severity === 'questionable' ? 'decreased' : 'decreased';
      opportunityWindow: tradingWindow
    }
  }

  private async generateInjuryAlerts(injury, InjuryReport, impact: InjuryImpact): : Promise<InjuryAlert[]> {
    const alerts: InjuryAlert[] = [];

    // Get users with this player on roster
    const affectedUsers = await database.query(`
      SELECT DISTINCT ur.user_id, u.name FROM user_rosters ur
      JOIN users u ON ur.user_id = u.id WHERE ur.player_id = $1
    `, [injury.playerId]);

    // Generate roster alerts
    for (const user of affectedUsers.rows) {
      alerts.push({
        id: `alert_${Date.now()}_${user.user_id}`,
        userId: user.user_id;
        playerId: injury.playerId;
        alertType: 'roster_player';
        severity: this.mapAlertSeverity(injury.severity);
        title: `🚨 ${injury.playerName} Injury Update`,
        message: `${injury.playerName} is ${injury.severity} with a ${injury.injuryType}.Fantasy projection changed by ${impact.immediateImpact.projectionChange.toFixed(1)} points.`,
        actionItems: this.generateActionItems(injury, impact),
        sentAt: new Date()
      });
    }

    return alerts;
  }

  private generateActionItems(injury, InjuryReport, impact: InjuryImpact): string[] {
    const actions: string[] = [];

    if (injury.severity === 'out') {
      actions.push('Remove from lineup immediately');
      actions.push('Check waiver wire for replacements');
    } else if (injury.severity === 'questionable') {
      actions.push('Monitor pregame reports closely');
      actions.push('Have backup plan ready');
    }

    if (impact.waiver.emergingTargets.length > 0) {
      actions.push(`Consider picking up ${impact.waiver.emergingTargets[0].playerName}`);
    }

    return actions;
  }

  private async broadcastInjuryUpdate(injury, InjuryReport, impact: InjuryImpact): : Promise<void> {
    const updateData = {
type: 'injury';
      injury, impact,
      timestamp: new Date().toISOString()
    }
    // Broadcast to affected users
    const affectedUsers = await database.query(`
      SELECT DISTINCT user_id
      FROM user_rosters WHERE player_id = $1
    `, [injury.playerId]);

    for (const user of affectedUsers.rows) {
      await sendToUser(user.user_id, {
        ...updateData,
        personalized: true
      });
    }
  }

  private async sendInjuryNotifications(alerts: InjuryAlert[]): : Promise<void> {; // Implementation would integrate with push notification service
    for (const alert of alerts) {
      console.log(`📱 Sending alert to user ${alert.userId} ${alert.title}`);
    }
  }

  private async storeInjuryReport(injury InjuryReport): : Promise<void> {
    await database.query(`
      INSERT INTO injury_reports (
        id, player_id, player_name, team, position, injury_type,
        severity, body_part, reported_at, game_week, is_game_time, source, confidence, expected_return, recovery_timeline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        severity = EXCLUDED.severity,
        reported_at = EXCLUDED.reported_at,
        confidence = EXCLUDED.confidence,
        expected_return = EXCLUDED.expected_return,
        recovery_timeline = EXCLUDED.recovery_timeline
    `, [
      injury.id, injury.playerId, injury.playerName, injury.team,
      injury.position, injury.injuryType, injury.severity, injury.bodyPart,
      injury.reportedAt, injury.gameWeek, injury.isGameTime, injury.source,
      injury.confidence, injury.expectedReturn, JSON.stringify(injury.recoveryTimeline)
    ]);
  }

  private async checkExistingInjury(playerId, string, injuryType: string): : Promise<InjuryReport | null> {
    const result = await database.query(`
      SELECT * FROM injury_reports 
      WHERE player_id = $1 AND injury_type = $2 
      ORDER BY reported_at DESC LIMIT 1
    `, [playerId, injuryType]);

    return result.rows[0] || null;
  }

  private isSignificantUpdate(existing, unknown, newReport: InjuryReport): boolean {
    return (existing as any).severity !== newReport.severity ||
           Math.abs(new Date((existing as any).reported_at).getTime() - newReport.reportedAt.getTime()) > 3600000; // 1 hour
  }

  private mapSeverity(status: string): 'questionable' | 'doubtful' | 'out' | 'ir' | 'pup' {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('questionable')) return 'questionable';
    if (statusLower.includes('doubtful')) return 'doubtful';
    if (statusLower.includes('out')) return 'out';
    if (statusLower.includes('ir')) return 'ir';
    if (statusLower.includes('pup')) return 'pup';
    return 'questionable';
  }

  private mapAlertSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'out', break,
    case 'ir': return 'critical';
      case 'doubtful':
      return 'high';
      break;
    case 'questionable': return 'medium';
      default: return 'low',
    }
  }

  async updateExistingInjuries(): : Promise<void> {
    const activeInjuries = await database.query(`
      SELECT * FROM injury_reports 
      WHERE severity IN ('questionable', 'doubtful', 'out')
      AND reported_at > NOW() - INTERVAL '7 days'
    `);

    for (const injury of activeInjuries.rows) {
      try {
        const updatedReport = await this.checkInjuryStatus(injury);
        if (updatedReport && this.isSignificantUpdate(injury, updatedReport)) {
          await this.handleNewInjuryReport(updatedReport);
        }
      } catch (error) {
        console.error(`Error updating injury ${injury.id}`, error);
      }
    }
  }

  private async checkInjuryStatus(injury: unknown): : Promise<InjuryReport | null> {; // Implementation would check across all sources
    return null;
  }

  async getPlayerInjuryHistory(playerId string, days: number = 30): : Promise<InjuryReport[]> {
    const result = await database.query(`
      SELECT * FROM injury_reports 
      WHERE player_id = $1 AND reported_at > NOW() - INTERVAL '${days} days'
      ORDER BY reported_at DESC
    `, [playerId]);

    return result.rows;
  }

  async getInjuryImpactSummary(playerId: string): : Promise<any> {
    const history = await this.getPlayerInjuryHistory(playerId);
    return {
      totalInjuries: history.length;
      currentStatus: history[0]?.severity || 'healthy';
      riskLevel: this.calculateInjuryRisk(history);
      lastInjury: history[0]?.reportedAt || null
    }
  }

  private calculateInjuryRisk(history: InjuryReport[]): 'low' | 'medium' | 'high' {
    const recentInjuries = history.filter(injury => new Date(injury.reportedAt).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000)
    );
    if (recentInjuries.length >= 3) return 'high';
    if (recentInjuries.length >= 2) return 'medium';
    return 'low';
  }
}

export default new LiveInjuryTracker();