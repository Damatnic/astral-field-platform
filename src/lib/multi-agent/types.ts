/**
 * Multi-Agent Development Team Coordination System - Type Definitions
 * Comprehensive types for agent specializations and coordination
 */

export type AgentType = 
  | 'nfl-data'
  | 'scoring-engine'
  | 'websocket'
  | 'security'
  | 'mobile-pwa'
  | 'analytics'
  | 'notification'
  | 'testing'
  | 'performance'
  | 'devops';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'testing' | 'completed' | 'failed' | 'blocked';
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AgentCapabilities {
  specializations: string[],
    skillLevel, number, // 1-100: maxConcurrentTasks, number,
    preferredTaskTypes: string[];
  availableTechnologies: string[],
    workingHours: {,
  start, number, // 0-23 hours,
    end, number,
    timezone: string,
  }
}

export interface AgentStatus { agentId: string,type: AgentType,
    isOnline, boolean,
  currentLoad, number, // 0-100%,
    activeTasks: string[];
  lastHeartbeat, Date,
    performance: {,
  tasksCompleted, number,
    averageCompletionTime, number,
    successRate, number,
    codeQualityScore: number,
  }
  health: {,
  cpuUsage, number,
    memoryUsage, number,
    errorCount, number,
    responseTime: number,
  }
}

export interface Task { id: string,
    title, string,
  description, string,type: string,
    priority, TaskPriority,
  status, TaskStatus,
  assignedAgentId?, string,
  requiredSkills: string[],
    estimatedDuration, number, // minutes
  dependencies: string[],
    files: { toModify: string[],
    toCreate: string[];
    toDelete: string[],
  }
  context: {,
  relatedFeature, string,
    impactedSystems: string[],
    testRequirements: string[],
  }
  quality: {,
  codeReviewRequired, boolean,
    testCoverageRequired, number,
    performanceThreshold?, number,
    securityReviewRequired: boolean,
  }
  createdAt, Date,
    updatedAt, Date,
  completedAt?, Date,
  metadata: Record<string, any>;
}

export interface CodeConflict { id: string,
    files: string[];
  conflictType: 'merge' | 'dependency' | 'api' | 'schema',
    severity, ConflictSeverity,
  description, string,
    involvedAgents: string[];
  detectedAt, Date,
  resolvedAt?, Date,
  resolution? : {;
  strategy, string,
    changes: Array<{;
  file, string,
    action: 'merge' | 'overwrite' | 'rename' | 'delete';
  content?, string,
   }
>;
    reviewedBy: string[],
  }
}

export interface QualityGate { id: string,
    name, string,type: 'pre_development' | 'code_review' | 'testing' | 'deployment',
    criteria: { codeQuality: { minScore: number,
      lintingRequired, boolean,
    typeCheckRequired: boolean,
    }
    testing: {,
  minCoverage, number,
      unitTestsRequired, boolean,
    integrationTestsRequired, boolean,
      e2eTestsRequired: boolean,
    }
    performance: {
      maxResponseTime?, number,
      maxMemoryUsage?, number,
      benchmarkRequired: boolean,
    }
    security: {,
  vulnerabilityScanRequired, boolean,
      dependencyAuditRequired, boolean,
    authenticationCheckRequired: boolean,
    }
  }
  automatedChecks: string[],
    manualReviewRequired: boolean,
}

export interface AgentMessage { id: string,type: 'task_assignment' | 'status_update' | 'conflict_alert' | 'quality_check' | 'coordination' | 'error',
    senderId, string,
  recipientId?, string, // undefined for broadcast
  content: {
    taskId?, string,
    status?, TaskStatus,
    data?, any,
    error?, string,
    priority?, TaskPriority,
  }
  timestamp, Date,
    requiresAck, boolean,
  correlationId?, string,
}

export interface CoordinationEvent { id: string,type: 'task_created' | 'task_assigned' | 'task_completed' | 'conflict_detected' | 'quality_gate_passed' | 'quality_gate_failed' | 'agent_online' | 'agent_offline' | 'system_alert';
  agentId?, string,
  taskId?, string,
  conflictId?, string,
  data, any,
    timestamp, Date,
  impact: 'low' | 'medium' | 'high',
  
}
export interface KnowledgeItem { id: string,type: 'best_practice' | 'architecture_decision' | 'bug_fix' | 'optimization' | 'pattern' | 'convention',
    title, string,
  content, string,
    tags: string[];
  relatedFiles: string[],
    createdBy, string,
  createdAt, Date,
    updatedAt, Date,
  votes, number,
    validated, boolean,
  examples: Array<{;
  description, string,
  code, string,
    language: string,
   }
>;
}

export interface AgentCoordinationConfig { maxConcurrentTasks: number,
    taskAssignmentStrategy: 'round_robin' | 'skill_based' | 'load_balanced' | 'priority_based';
  conflictResolutionTimeout, number, // minutes,
    qualityGateTimeout, number, // minutes;
  heartbeatInterval, number, // seconds,
    autoRetryAttempts, number,
  emergencyEscalationThreshold, number, // consecutive failures,
    performanceMonitoringInterval, number, // seconds;
  knowledgeBaseUpdateFrequency, number, // minutes;
  
}
export interface AgentMetrics { agentId: string,
    timeWindow: {,
  start, Date,
    end: Date,
  }
  tasks: {,
  assigned, number,
    completed, number,
    failed, number,
    averageTime: number,
  }
  quality: {,
  codeReviewScore, number,
    testCoverage, number,
    bugCount, number,
    performanceScore: number,
  }
  collaboration: {,
  conflictsInvolved, number,
    conflictsResolved, number,
    knowledgeContributions, number,
    helpfulnessScore: number,
  }
  efficiency: {,
  utilizationRate, number,
    responseTime, number,
    throughput: number,
  }
}

export interface SystemHealth { timestamp: Date,
    overallStatus: 'healthy' | 'degraded' | 'critical';
  agents: {,
  total, number,
    online, number,
    busy, number,
    idle, number,
    failed: number,
  }
  tasks: {,
  pending, number,
    inProgress, number,
    completed, number,
    failed, number,
    blocked: number,
  }
  performance: {,
  averageTaskTime, number,
    systemThroughput, number,
    errorRate, number,
    responseTime: number,
  }
  resources: {,
  cpuUsage, number,
    memoryUsage, number,
    diskUsage, number,
    networkLatency: number,
  }
  alerts: Array<{ severity: 'info' | 'warning' | 'error' | 'critical';
    message, string,
    component, string,
    timestamp: Date,
  }>;
}

// Fantasy Football specific extensions
export interface FantasyAgentContext {
  league: {,
  id, string,
    season, number,
    week, number,type: 'redraft' | 'keeper' | 'dynasty',
  }
  players: { affectedIds: string[];
    positions: string[],
    teams: string[],
  }
  features: { impactedModules: string[];
    userFacingChanges, boolean,
    realTimeUpdates: boolean,
  }
}

export interface FantasyTask extends Task { fantasyContext: FantasyAgentContext,
    scoringImpact, boolean,
  liveGameImpact, boolean,
    tradingImpact, boolean,
  draftImpact: boolean,
}

export interface AgentSpecialization { type: 'AgentType',
    name, string,
  description, string,
    responsibilities: string[];
  technologies: string[],
    integrations: string[];
  qualityStandards: {,
  testCoverage, number,
    performanceRequirements: string[],
    securityRequirements: string[];
    documentationRequirements: string[],
  }
}