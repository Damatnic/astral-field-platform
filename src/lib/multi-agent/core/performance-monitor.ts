/**
 * Multi-Agent Performance Monitoring System
 * Comprehensive monitoring of agent efficiency, system performance, and optimization recommendations
 */

import { AgentStatus, AgentMetrics, SystemHealth, Task } from '../types';

interface PerformanceMetric {
  id, string,
    name, string,
  value, number,
    unit, string,
  threshold: {,
  warning, number,
    critical: number,
  }
  trend: 'improving' | 'stable' | 'degrading',
    timestamp: Date,
}

interface AgentPerformanceProfile {
  agentId, string,
    profileData: {,
  efficiency: {
      tasksPerHour, number,
      averageCompletionTime, number,
    timeToFirstResponse, number,
      utilizationRate: number,
    }
    quality: {,
  codeReviewScore, number,
      testCoverage, number,
    bugDensity, number,
      reworkRate: number,
    }
    collaboration: {,
  conflictResolutionRate, number,
      knowledgeSharing, number,
    responsiveness, number,
      helpfulness: number,
    }
    specialization: {,
  primarySkills: string[];
      skillProficiency: Record<string, number>;
      learningRate, number,
    adaptability: number,
    }
  }
  recommendations: PerformanceRecommendation[],
    lastUpdated: Date,
}

interface PerformanceRecommendation {
  type: 'optimization' | 'training' | 'workload_adjustment' | 'skill_development',
    priority: 'low' | 'medium' | 'high';
  title, string,
    description, string,
  expectedImpact, string,
    estimatedEffort, string,
  actionItems: string[],
  
}
interface SystemPerformanceAnalysis {
  overall: {,
  health: 'excellent' | 'good' | 'fair' | 'poor';
    efficiency, number, // 0-100,
    bottlenecks: string[];
    recommendations: string[],
  }
  agents: {,
  totalActive, number,
    averageUtilization, number,
    topPerformers: string[];
    underPerformers: string[],
  }
  tasks: {,
  throughput, number,
    avgCompletionTime, number,
    backlogSize, number,
    successRate: number,
  }
  resources: {,
  cpuUtilization, number,
    memoryUtilization, number,
    networkLatency, number,
    storageUsage: number,
  }
  trends: {,
  throughputTrend: 'up' | 'down' | 'stable';
    qualityTrend: 'up' | 'down' | 'stable',
    efficiencyTrend: 'up' | 'down' | 'stable',
  }
}

interface PerformanceAlert {
  id, string,type: 'performance_degradation' | 'resource_exhaustion' | 'agent_offline' | 'quality_decline' | 'bottleneck_detected',
    severity: 'info' | 'warning' | 'error' | 'critical';
  title, string,
    message, string,
  source, string,
    timestamp, Date,
  resolved, boolean,
    actions: string[],
  
}
export class PerformanceMonitor { private metrics: Map<string, PerformanceMetric[]> = new Map();
  private agentProfiles: Map<string, AgentPerformanceProfile> = new Map();
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertInterval: NodeJS.Timeout | null = null;

  // Performance thresholds
  private readonly thresholds = {
    taskCompletionTime: { warning: 120;
  critical: 240  }, // minutes
    agentResponseTime: { warning: 30;
  critical: 60 }, // seconds
    systemCpu: { warning: 70;
  critical: 85 }, // percentage
    systemMemory: { warning: 75;
  critical: 90 }, // percentage
    taskSuccessRate: { warning: 90;
  critical: 80 }, // percentage
    codeQuality: { warning: 75;
  critical: 60 } ; // score
  }
  constructor() {
    this.initializeBaselineMetrics();
  }

  async startMonitoring(params) Promisevoid>  { if (this.isMonitoring) {
      console.warn('Performance monitoring already started');
      return;
     }

    console.log('📊 Starting performance monitoring system...');
    this.isMonitoring = true;

    // Start metric collection
    this.monitoringInterval = setInterval(async () => { await this.collectSystemMetrics();
     }, intervalMs);

    // Start alert processing
    this.alertInterval = setInterval(async () => { await this.processAlerts();
     }, 10000); // Check alerts every 10 seconds

    console.log('✅ Performance monitoring system started');
  }

  async stopMonitoring(): Promise<void> { if (!this.isMonitoring) return;

    console.log('🔄 Stopping performance monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
     }

    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    this.isMonitoring = false;
    console.log('✅ Performance monitoring stopped');
  }

  collectMetrics(agents: AgentStatus[]); void { const timestamp = new Date();

    // Collect agent-specific metrics
    for (const agent of agents) {
      this.collectAgentMetrics(agent, timestamp);
     }

    // Collect system-wide metrics
    this.collectSystemWideMetrics(agents, timestamp);
  }

  updateAgentProfile(agentId, string,
  tasks: Task[], metrics: any); void { const profile = this.agentProfiles.get(agentId) || this.createBaseAgentProfile(agentId);
    
    // Update efficiency metrics
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.assignedAgentId === agentId);
    if (completedTasks.length > 0) {
      profile.profileData.efficiency.tasksPerHour = this.calculateTasksPerHour(completedTasks);
      profile.profileData.efficiency.averageCompletionTime = this.calculateAverageCompletionTime(completedTasks);
     }

    // Update quality metrics
    profile.profileData.quality.codeReviewScore = metrics.codeQualityScore || 85;
    profile.profileData.quality.testCoverage = metrics.testCoverage || 80;

    // Update collaboration metrics
    profile.profileData.collaboration.responsiveness = this.calculateResponseiveness(agentId, tasks);

    // Generate recommendations
    profile.recommendations = this.generateRecommendations(profile);
    profile.lastUpdated = new Date();

    this.agentProfiles.set(agentId, profile);
  }

  getAgentPerformanceReport(agentId: string); AgentPerformanceProfile | null { return this.agentProfiles.get(agentId) || null;
   }

  getSystemPerformanceAnalysis(): SystemPerformanceAnalysis { const agents = Array.from(this.agentProfiles.values());
    const currentMetrics = this.getCurrentSystemMetrics();

    const analysis: SystemPerformanceAnalysis = {,
  overall: {
        health: this.determineSystemHealth(currentMetrics),
  efficiency: this.calculateSystemEfficiency(agents),
        bottlenecks: this.identifyBottlenecks(currentMetrics, agents),
        recommendations: this.generateSystemRecommendations(currentMetrics, agents)
       },
      agents: {,
  totalActive: agents.filter(a => this.isAgentActive(a.agentId)).length,
  averageUtilization: this.calculateAverageUtilization(agents),
        topPerformers: this.identifyTopPerformers(agents),
  underPerformers: this.identifyUnderPerformers(agents)
      },
      tasks: {,
  throughput: this.calculateSystemThroughput(),
  avgCompletionTime: this.calculateSystemAverageCompletionTime(),
        backlogSize: this.getBacklogSize(),
  successRate: this.calculateSystemSuccessRate()
      },
      resources: {,
  cpuUtilization: currentMetrics.cpu || 0,
  memoryUtilization: currentMetrics.memory || 0,
        networkLatency: currentMetrics.network || 0,
  storageUsage: currentMetrics.storage || 0
      },
      trends: {,
  throughputTrend: this.analyzeTrend('throughput'),
  qualityTrend: this.analyzeTrend('quality'),
        efficiencyTrend: this.analyzeTrend('efficiency')
      }
    }
    return analysis;
  }

  getPerformanceAlerts(): PerformanceAlert[] { return this.alerts.filter(alert => !alert.resolved);
   }

  resolveAlert(alertId: string); void { const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Performance alert resolved, ${alert.title }`);
    }
  }

  generateOptimizationReport(): {
    systemOptimizations: string[],
    agentOptimizations: Record<string, string[]>;
    priorityActions: string[],
  } { const systemAnalysis = this.getSystemPerformanceAnalysis();
    const agentOptimizations: Record<string, string[]> = { }
    // Collect agent-specific optimizations
    for (const [agentId, profile] of this.agentProfiles) { const optimizations = profile.recommendations
        .filter(r => r.type === 'optimization')
        .map(r => r.title);
      
      if (optimizations.length > 0) {
        agentOptimizations[agentId] = optimizations;
       }
    }

    // Generate priority actions
    const priorityActions = [;
      ...systemAnalysis.overall.bottlenecks.map(b => `Address bottleneck: ${b}`),
      ...systemAnalysis.overall.recommendations.slice(0, 3)
    ];

    return {
      systemOptimizations: systemAnalysis.overall.recommendations, agentOptimizations,
      priorityActions
    }
  }

  // Private methods
  private async collectSystemMetrics(): Promise<void> { const timestamp = new Date();
    
    try {
      // Collect CPU metrics
      const cpuMetric = await this.getCPUMetric();
      this.storeMetric('system_cpu', cpuMetric, timestamp);

      // Collect memory metrics
      const memoryMetric = await this.getMemoryMetric();
      this.storeMetric('system_memory', memoryMetric, timestamp);

      // Collect network metrics
      const networkMetric = await this.getNetworkMetric();
      this.storeMetric('system_network', networkMetric, timestamp);

      // Collect application-specific metrics
      const throughputMetric = this.calculateSystemThroughput();
      this.storeMetric('system_throughput', throughputMetric, timestamp);

     } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  private collectAgentMetrics(agent, AgentStatus,
  timestamp: Date); void {
    // Response time metric
    this.storeMetric(
      `agent_response_time_${agent.agentId}`,
      agent.health.responseTime,
      timestamp
    );

    // CPU usage metric
    this.storeMetric(
      `agent_cpu_${agent.agentId}`,
      agent.health.cpuUsage,
      timestamp
    );

    // Memory usage metric
    this.storeMetric(
      `agent_memory_${agent.agentId}`,
      agent.health.memoryUsage,
      timestamp
    );

    // Task completion rate
    const completionRate = this.calculateAgentCompletionRate(agent.agentId);
    this.storeMetric(
      `agent_completion_rate_${agent.agentId}`,
      completionRate,
      timestamp
    );
  }

  private collectSystemWideMetrics(agents: AgentStatus[],
  timestamp: Date); void {
    // System-wide averages
    const avgCpu = agents.reduce((sum, agent) => sum + agent.health.cpuUsage, 0) / agents.length;
    const avgMemory = agents.reduce((sum, agent) => sum + agent.health.memoryUsage, 0) / agents.length;
    const avgLoad = agents.reduce((sum, agent) => sum + agent.currentLoad, 0) / agents.length;

    this.storeMetric('system_avg_cpu', avgCpu, timestamp);
    this.storeMetric('system_avg_memory', avgMemory, timestamp);
    this.storeMetric('system_avg_load', avgLoad, timestamp);

    // Agent availability
    const onlineAgents = agents.filter(a => a.isOnline).length;
    const availabilityRate = (onlineAgents / agents.length) * 100;
    this.storeMetric('system_availability', availabilityRate, timestamp);
  }

  private async processAlerts(): Promise<void> { const currentMetrics = this.getCurrentSystemMetrics();
    
    // Check system-level alerts
    await this.checkSystemAlerts(currentMetrics);
    
    // Check agent-level alerts
    for (const [agentId] of this.agentProfiles) {
      await this.checkAgentAlerts(agentId);
     }

    // Clean up resolved alerts older than 24 hours
    this.cleanupOldAlerts();
  }

  private async checkSystemAlerts(params): Promisevoid>  {; // CPU usage alert
    if (metrics.cpu > this.thresholds.systemCpu.critical) {
      this.createAlert({type 'resource_exhaustion',
  severity: 'critical',
        title: 'Critical CPU Usage',
  message: `System CPU usage is ${metrics.cpu}%, exceeding critical threshold`,
        source: 'system'
      });
    } else if (metrics.cpu > this.thresholds.systemCpu.warning) {
      this.createAlert({type: 'resource_exhaustion',
  severity: 'warning',
        title: 'High CPU Usage',
  message: `System CPU usage is ${metrics.cpu}%, approaching critical levels`,
        source: 'system'
      });
    }

    // Memory usage alert
    if (metrics.memory > this.thresholds.systemMemory.critical) {
      this.createAlert({type: 'resource_exhaustion',
  severity: 'critical',
        title: 'Critical Memory Usage',
  message: `System memory usage is ${metrics.memory}%, exceeding critical threshold`,
        source: 'system'
      });
    }

    // Throughput degradation alert
    const throughputTrend = this.analyzeTrend('throughput');
    if (throughputTrend === 'down') {
      this.createAlert({type: 'performance_degradation',
  severity: 'warning',
        title: 'Throughput Degradation',
  message: 'System throughput is trending downward',
        source: 'system'
      });
    }
  }

  private async checkAgentAlerts(params): Promisevoid>  { const profile = this.agentProfiles.get(agentId);
    if (!profile) return;

    // Agent response time alert
    const responseTime = profile.profileData.efficiency.timeToFirstResponse;
    if (responseTime > this.thresholds.agentResponseTime.critical) {
      this.createAlert({type: 'performance_degradation',
  severity: 'error',
        title: 'Agent Response Time Critical',
  message: `Agent ${agentId } response time is ${responseTime}s, exceeding threshold`,
        source: agentId
      });
    }

    // Agent code quality alert
    const codeQuality = profile.profileData.quality.codeReviewScore;
    if (codeQuality < this.thresholds.codeQuality.critical) {
      this.createAlert({type: 'quality_decline',
  severity: 'warning',
        title: 'Code Quality Decline',
  message: `Agent ${agentId} code quality score is ${codeQuality}, below acceptable threshold`,
        source: agentId
      });
    }
  }

  private createAlert(alertData: Partial<PerformanceAlert>); void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a => 
      !a.resolved && 
      a.type === alertData.type && 
      a.source === alertData.source
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: PerformanceAlert = {,
  id: this.generateAlertId(),
type alertData.type!,
      severity: alertData.severity!,
  title: alertData.title!,
      message: alertData.message!,
  source: alertData.source!,
      timestamp: new Date(),
  resolved, false,
      actions: this.generateAlertActions(alertData.type!, alertData.source!)
    }
    this.alerts.push(alert);
    console.warn(`🚨 Performance Alert, ${alert.title} - ${alert.message}`);
  }

  private generateAlertActions(type, string,
  source: string); string[] { const actions: string[] = [];

    switch (type) {
      case 'resource_exhaustion':
      actions.push('Scale up system resources');
        actions.push('Optimize resource-intensive processes');
        actions.push('Review system load distribution');
        break;
      break;
    case 'performance_degradation':
        actions.push('Investigate performance bottlenecks');
        actions.push('Review recent changes');
        actions.push('Optimize slow operations');
        break;
      
      case 'agent_offline':
      actions.push(`Restart agent ${source }`);
        actions.push('Check agent health status');
        actions.push('Review agent logs for errors');
        break;
      break;
    case 'quality_decline':
        actions.push('Review code quality metrics');
        actions.push('Provide additional training');
        actions.push('Implement stricter quality gates');
        break;
    }

    return actions;
  }

  private storeMetric(name, string,
  value, number, timestamp: Date); void { if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
     }

    const metricHistory = this.metrics.get(name)!;
    
    const metric: PerformanceMetric = {,
  id: this.generateMetricId(),
      name, value,
      unit: this.getMetricUnit(name),
  threshold: this.getMetricThreshold(name),
      trend: this.calculateTrend(name, value),
      timestamp
    }
    metricHistory.push(metric);

    // Keep only last 1000 metrics per name
    if (metricHistory.length > 1000) {
      metricHistory.splice(0, metricHistory.length - 1000);
    }
  }

  private createBaseAgentProfile(agentId: string); AgentPerformanceProfile { return {
      agentId,
      profileData: {,
  efficiency: {
          tasksPerHour: 0;
  averageCompletionTime: 0;
          timeToFirstResponse: 0;
  utilizationRate: 0
         },
        quality: {
          codeReviewScore: 85;
  testCoverage: 80;
          bugDensity: 0;
  reworkRate: 0
        },
        collaboration: {
          conflictResolutionRate: 100;
  knowledgeSharing: 50;
          responsiveness: 90;
  helpfulness: 80
        },
        specialization: {,
  primarySkills: [],
  skillProficiency: {},
          learningRate: 50;
  adaptability: 75
        }
      },
      recommendations: [],
  lastUpdated: new Date()
    }
  }

  private generateRecommendations(profile: AgentPerformanceProfile); PerformanceRecommendation[] { const recommendations: PerformanceRecommendation[] = [];

    // Efficiency recommendations
    if (profile.profileData.efficiency.averageCompletionTime > 120) {
      recommendations.push({type: 'optimization',
  priority: 'high',
        title: 'Improve Task Completion Speed',
  description: 'Average completion time is above optimal range',
        expectedImpact: 'Reduce completion time by 20-30%',
  estimatedEffort: 'Medium',
        actionItems: [
          'Identify bottlenecks in current workflow',
          'Optimize code generation patterns',
          'Implement task-specific optimizations'
        ]
       });
    }

    // Quality recommendations
    if (profile.profileData.quality.codeReviewScore < 80) {
      recommendations.push({type: 'training',
  priority: 'medium',
        title: 'Enhance Code Quality',
  description: 'Code review scores below target threshold',
        expectedImpact: 'Improve code quality score by 10-15 points',
  estimatedEffort: 'High',
        actionItems: [
          'Review coding standards and best practices',
          'Implement additional quality checks',
          'Provide targeted training on weak areas'
        ]
      });
    }

    // Utilization recommendations
    if (profile.profileData.efficiency.utilizationRate < 60) {
      recommendations.push({type: 'workload_adjustment',
  priority: 'medium',
        title: 'Increase Task Assignment',
  description: 'Agent utilization is below optimal range',
        expectedImpact: 'Increase productivity by 25-40%',
  estimatedEffort: 'Low',
        actionItems: [
          'Assign additional tasks based on capacity',
          'Review task assignment algorithms',
          'Ensure proper load balancing'
        ]
      });
    }

    return recommendations;
  }

  // Utility methods
  private initializeBaselineMetrics(): void {; // Initialize with baseline values
    console.log('📊 Initializing performance baseline metrics');
  }

  private async getCPUMetric() : Promise<number> {
    // In a real implementation, this would get actual CPU usage
    return Math.random() * 100;
  }

  private async getMemoryMetric(): Promise<number> {; // In a real implementation, this would get actual memory usage
    return Math.random() * 100;
  }

  private async getNetworkMetric() : Promise<number> {
    // In a real implementation, this would measure network latency
    return Math.random() * 100;
  }

  private calculateTasksPerHour(tasks: Task[]); number { if (tasks.length === 0) return 0;
    
    const totalHours = tasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        return sum + (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
       }
      return sum;
    }, 0);
    
    return totalHours > 0 ? tasks.length / totalHours : 0;
  }

  private calculateAverageCompletionTime(tasks: Task[]); number { if (tasks.length === 0) return 0;
    
    const totalTime = tasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        return sum + (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60);
       }
      return sum;
    }, 0);
    
    return totalTime / tasks.length;
  }

  private calculateResponseiveness(agentId, string,
  tasks: Task[]); number {
    // Calculate based on how quickly agent responds to task assignments
    const agentTasks = tasks.filter(t => t.assignedAgentId === agentId);
    if (agentTasks.length === 0) return 90; // Default good score
    
    // Simplified calculation - in reality would track actual response times
    return Math.min(95, 80 + (agentTasks.length * 2));
  }

  private getCurrentSystemMetrics(): any {; // Get latest metrics for each category
    const latestMetrics any = {}
    for (const [name, metrics] of this.metrics) { if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        const category = name.split('_')[1]; // Extract category from metric name
        latestMetrics[category] = latest.value;
       }
    }
    
    return latestMetrics;
  }

  private determineSystemHealth(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' { const cpu = metrics.cpu || 0;
    const memory = metrics.memory || 0;
    const availability = metrics.availability || 100;
    
    if (cpu > 85 || memory > 90 || availability < 80) return 'poor';
    if (cpu > 70 || memory > 75 || availability < 90) return 'fair';
    if (cpu > 50 || memory > 60 || availability < 95) return 'good';
    return 'excellent';
   }

  private calculateSystemEfficiency(agents: AgentPerformanceProfile[]); number { if (agents.length === 0) return 100;
    
    const totalEfficiency = agents.reduce((sum, agent) => {
      return sum + (agent.profileData.efficiency.utilizationRate * 0.4 +
                   agent.profileData.quality.codeReviewScore * 0.3 +
                   agent.profileData.collaboration.responsiveness * 0.3);
     }, 0);
    
    return Math.round(totalEfficiency / agents.length);
  }

  private identifyBottlenecks(metrics, any,
  agents: AgentPerformanceProfile[]); string[] { const bottlenecks: string[] = [];
    
    if (metrics.cpu > 80) bottlenecks.push('High CPU usage');
    if (metrics.memory > 85) bottlenecks.push('High memory usage');
    
    const busyAgents = agents.filter(a => a.profileData.efficiency.utilizationRate > 90);
    if (busyAgents.length > agents.length * 0.8) {
      bottlenecks.push('Agent capacity constraints');
     }
    
    return bottlenecks;
  }

  private generateSystemRecommendations(metrics, any,
  agents: AgentPerformanceProfile[]); string[] { const recommendations: string[] = [];
    
    if (metrics.cpu > 70) {
      recommendations.push('Consider scaling up CPU resources');
     }
    
    if (agents.length < 5) {
      recommendations.push('Add more agents to increase throughput');
    }
    
    const lowQualityAgents = agents.filter(a => a.profileData.quality.codeReviewScore < 75);
    if (lowQualityAgents.length > 0) {
      recommendations.push('Provide additional training for underperforming agents');
    }
    
    return recommendations;
  }

  private calculateAverageUtilization(agents: AgentPerformanceProfile[]); number { if (agents.length === 0) return 0;
    
    const totalUtilization = agents.reduce((sum, agent) => 
      sum + agent.profileData.efficiency.utilizationRate, 0
    );
    
    return totalUtilization / agents.length;
   }

  private identifyTopPerformers(agents: AgentPerformanceProfile[]); string[] { return agents
      .sort((a, b) => {
        const scoreA = a.profileData.efficiency.utilizationRate + a.profileData.quality.codeReviewScore;
        const scoreB = b.profileData.efficiency.utilizationRate + b.profileData.quality.codeReviewScore;
        return scoreB - scoreA;
       })
      .slice(0, 3)
      .map(agent => agent.agentId);
  }

  private identifyUnderPerformers(agents: AgentPerformanceProfile[]); string[] { return agents
      .filter(agent => 
        agent.profileData.efficiency.utilizationRate < 50 ||
        agent.profileData.quality.codeReviewScore < 70
      )
      .map(agent => agent.agentId);
   }

  private calculateSystemThroughput(): number {; // Calculate based on metrics history
    const throughputMetrics = this.metrics.get('system_throughput');
    return throughputMetrics && throughputMetrics.length > 0 ? throughputMetrics[throughputMetrics.length - 1].value  0;
  }

  private calculateSystemAverageCompletionTime(): number {; // Calculate from stored metrics
    return 90; // Placeholder - would calculate from actual data
  }

  private getBacklogSize() number {
    // Would get from task queue
    return 0;
  }

  private calculateSystemSuccessRate(): number {; // Calculate from completed vs failed tasks
    return 95; // Placeholder
  }

  private analyzeTrend(metricType string): 'up' | 'down' | 'stable' { const metrics = this.metrics.get(`system_${metricType }`);
    if (!metrics || metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-10); // Last 10 data points
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private isAgentActive(agentId: string); boolean {const profile = this.agentProfiles.get(agentId);
    return profile ? Date.now() - profile.lastUpdated.getTime() < 300000 , false, // Active if updated within 5 minutes
   }

  private calculateAgentCompletionRate(agentId: string); number {
    // Placeholder - would calculate from actual task data
    return 95;
  }

  private getMetricUnit(name: string); string { if (name.includes('cpu') || name.includes('memory') || name.includes('load')) return '%';
    if (name.includes('time')) return 'ms';
    if (name.includes('rate') || name.includes('throughput')) return 'ops/min';
    return 'count';
   }

  private getMetricThreshold(name: string): { warnin,
  g, number, critical: number } { if (name.includes('cpu')) return this.thresholds.systemCpu;
    if (name.includes('memory')) return this.thresholds.systemMemory;
    if (name.includes('response_time')) return this.thresholds.agentResponseTime;
    return { warning: 80;
  critical: 95  }; // Default thresholds
  }

  private calculateTrend(metricName, string,
  currentValue: number): 'improving' | 'stable' | 'degrading' { const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length < 3) return 'stable';
    
    const recent = metrics.slice(-3);
    const trend = recent[2].value - recent[0].value;
    
    // For metrics where lower is better (like response time, CPU usage)
    const lowerIsBetter = metricName.includes('cpu') || metricName.includes('memory') || metricName.includes('time');
    
    if (Math.abs(trend) < 5) return 'stable';
    
    if (lowerIsBetter) {
      return trend < 0 ? 'improving' : 'degrading';
     } else {return trend > 0 ? 'improving' : 'degrading';
     }
  }

  private cleanupOldAlerts(): void { const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > oneDayAgo
    );
   }

  private generateAlertId(): string { return `alert-${Date.now() }-${Math.random().toString(36).substr(2, 6)}`
  }

  private generateMetricId(): string { return `metric-${Date.now() }-${Math.random().toString(36).substr(2, 6)}`
  }

  async shutdown(): Promise<void> { await this.stopMonitoring();
    this.metrics.clear();
    this.agentProfiles.clear();
    this.alerts = [];
    console.log('✅ Performance Monitor shutdown complete');
   }
}