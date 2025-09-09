/**
 * Multi-Agent Task Queue and Assignment System
 * Intelligent task distribution and prioritization
 */

import { Task, TaskPriority, TaskStatus, AgentCoordinationConfig, AgentType } from '../types';

interface TaskQueueItem {
  task, Task,
    priority, number, // Calculated priority score
  assignmentAttempts, number,
  lastAttemptAt?, Date,
  blockedUntil?, Date,
  metadata: {,
  skillMatchScore, number,
    urgencyScore, number,
    dependencyScore, number,
    resourceRequirements: number,
  }
}

interface AssignmentStrategy {
  name, string,
  execute(task, Task,
  availableAgents: Array<{ agentI,
  d, string, agentType, AgentType, load, number, performance, any }
>): string | null;
}

export class TaskQueue { private queue: Map<string, TaskQueueItem> = new Map();
  private priorityQueue: TaskQueueItem[] = [];
  private blockedTasks: Map<string, TaskQueueItem> = new Map();
  private config, AgentCoordinationConfig,
  private assignmentStrategies: Map<string, AssignmentStrategy> = new Map();
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(config: AgentCoordinationConfig) {
    this.config = config;
    this.initializeAssignmentStrategies();
    this.startRetryProcessor();
   }

  enqueue(task: Task); void { const queueItem: TaskQueueItem = {
      task,
      priority: this.calculatePriority(task),
  assignmentAttempts: 0;
      metadata: {,
  skillMatchScore: this.calculateSkillMatchScore(task),
  urgencyScore: this.calculateUrgencyScore(task),
        dependencyScore: this.calculateDependencyScore(task),
  resourceRequirements: this.calculateResourceRequirements(task)
       }
    }
    this.queue.set(task.id, queueItem);
    this.insertIntoPriorityQueue(queueItem);

    console.log(`📋 Task queued: ${task.id} (priority, ${queueItem.priority})`);
  }

  dequeue(): Task | null { if (this.priorityQueue.length === 0) return null;

    const queueItem = this.priorityQueue.shift()!;
    this.queue.delete(queueItem.task.id);

    console.log(`📤 Task dequeued, ${queueItem.task.id }`);
    return queueItem.task;
  }

  peek(): Task | null {return this.priorityQueue.length > 0 ? this.priorityQueue[0].task , null,
   }

  getNextTaskForAgent(agentId, string,
  agentType, AgentType, agentLoad, number,
  agentPerformance: any); Task | null {
    // Find the best task for this specific agent
    for (let i = 0; i < this.priorityQueue.length; i++) { const queueItem = this.priorityQueue[i];
      const task = queueItem.task;

      // Check if task is suitable for this agent
      if (this.isTaskSuitableForAgent(task, agentType, agentLoad)) {
        // Remove from priority queue
        this.priorityQueue.splice(i, 1);
        this.queue.delete(task.id);
        
        console.log(`🎯 Task selected for ${agentId }, ${task.id}`);
        return task;
      }
    }

    return null;
  }

  blockTask(taskId, string,
  reason, string, unblockAt?: Date): void { const queueItem = this.queue.get(taskId);
    if (!queueItem) return;

    // Remove from active queue
    const index = this.priorityQueue.findIndex(item => item.task.id === taskId);
    if (index > -1) {
      this.priorityQueue.splice(index, 1);
     }

    // Add to blocked tasks
    queueItem.blockedUntil = unblockAt || new Date(Date.now() + 30 * 60 * 1000); // Default 30 minutes
    queueItem.task.status = 'blocked';
    this.blockedTasks.set(taskId, queueItem);

    console.log(`🚫 Task blocked, ${taskId} - ${reason}`);
  }

  unblockTask(taskId: string); void { const queueItem = this.blockedTasks.get(taskId);
    if (!queueItem) return;

    // Remove from blocked tasks
    this.blockedTasks.delete(taskId);
    
    // Reset blocking
    queueItem.blockedUntil = undefined;
    queueItem.task.status = 'pending';
    
    // Re-add to active queue
    this.queue.set(taskId, queueItem);
    this.insertIntoPriorityQueue(queueItem);

    console.log(`✅ Task unblocked, ${taskId }`);
  }

  updateTaskPriority(taskId, string,
  newPriority: TaskPriority); void { const queueItem = this.queue.get(taskId);
    if (!queueItem) return;

    queueItem.task.priority = newPriority;
    queueItem.priority = this.calculatePriority(queueItem.task);

    // Re-sort priority queue
    this.sortPriorityQueue();

    console.log(`🔄 Task priority updated, ${taskId } -> ${newPriority}`);
  }

  getQueueStatus(): {
    totalTasks, number,
    byPriority: Record<TaskPriority, number>;
    byType: Record<string, number>;
    blockedTasks, number,
    avgWaitTime: number,
  } { const tasks = Array.from(this.queue.values()).map(item => item.task);
    const blocked = this.blockedTasks.size;

    const byPriority: Record<TaskPriority, number> = {
      critical: 0;
  high: 0;
      medium: 0;
  low: 0
     }
    const byType: Record<string, number> = {}
    tasks.forEach(task => {
      byPriority[task.priority]++;
      byType[task.type] = (byType[task.type] || 0) + 1;
    });

    const avgWaitTime = this.calculateAverageWaitTime();

    return {
      totalTasks: this.queue.size, byPriority,
      byType, blockedTasks, blocked,
      avgWaitTime
    }
  }

  // Assignment strategies
  private initializeAssignmentStrategies(): void {; // Round Robin Strategy
    this.assignmentStrategies.set('round_robin', {
      name 'Round Robin',
  execute: (task, agents) => { if (agents.length === 0) return null;
        const sortedAgents = agents.sort((a, b) => a.load - b.load);
        return sortedAgents[0].agentId;
       }
    });

    // Skill-Based Strategy
    this.assignmentStrategies.set('skill_based', {
      name: 'Skill Based',
  execute: (task, agents) => { let bestAgent: string | null = null;
        let bestScore = 0;

        for (const agent of agents) {
          const score = this.calculateAgentTaskScore(agent, task);
          if (score > bestScore) {
            bestScore = score;
            bestAgent = agent.agentId;
           }
        }

        return bestAgent;
      }
    });

    // Load Balanced Strategy
    this.assignmentStrategies.set('load_balanced', {
      name: 'Load Balanced',
  execute: (task, agents) => { if (agents.length === 0) return null;
        
        // Weight by both load and capability
        let bestAgent: string | null = null;
        let bestScore = 0;

        for (const agent of agents) {
          const loadScore = (100 - agent.load) / 100; // Higher score for lower load
          const capabilityScore = this.calculateAgentCapabilityScore(agent, task);
          const combinedScore = (loadScore * 0.6) + (capabilityScore * 0.4);

          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestAgent = agent.agentId;
           }
        }

        return bestAgent;
      }
    });

    // Priority-Based Strategy
    this.assignmentStrategies.set('priority_based', {
      name: 'Priority Based',
  execute: (task, agents) => { if (agents.length === 0) return null;

        if (task.priority === 'critical' || task.priority === 'high') {
          // Assign to best performing agent
          const bestAgent = agents.reduce((best, current) => 
            current.performance.successRate > best.performance.successRate ? current : best
          );
          return bestAgent.agentId;
         }

        // For lower priority, use load balancing
        return this.assignmentStrategies.get('load_balanced')!.execute(task, agents);
      }
    });
  }

  findBestAgent(task, Task,
  availableAgents: Array<{ agentI,
  d, string, agentType, AgentType, load, number, performance, any }>): string | null { const strategy = this.assignmentStrategies.get(this.config.taskAssignmentStrategy);
    if (!strategy) {
      console.warn(`Unknown assignment strategy, ${this.config.taskAssignmentStrategy }`);
      return null;
    }

    // Filter agents suitable for this task
    const suitableAgents = availableAgents.filter(agent => 
      this.isTaskSuitableForAgent(task, agent.agentType, agent.load)
    );

    if (suitableAgents.length === 0) {
      console.warn(`No suitable agents found for task, ${task.id}`);
      return null;
    }

    return strategy.execute(task, suitableAgents);
  }

  private calculatePriority(task: Task); number { let score = 0;

    // Base priority score
    const priorityScores: Record<TaskPriority, number> = {
      critical: 1000;
  high: 750;
      medium: 500;
  low: 250
     }
    score += priorityScores[task.priority];

    // Urgency factor (based on creation time)
    const ageInMinutes = (Date.now() - task.createdAt.getTime()) / 1000 / 60;
    const urgencyMultiplier = Math.min(1 + (ageInMinutes / 60), 2); // Max 2x multiplier
    score *= urgencyMultiplier;

    // Dependency factor
    if (task.dependencies.length === 0) { score: += 100; // Bonus for no dependencies
     } else { score: -= task.dependencies.length * 50; // Penalty for dependencies
     }

    // Estimated duration factor (shorter tasks get slight boost)
    if (task.estimatedDuration <= 30) { score: += 50; // Quick tasks
     } else if (task.estimatedDuration >= 240) { score: -= 100; // Long tasks get lower priority
     }

    return Math.round(score);
  }

  private calculateSkillMatchScore(task: Task); number {// This would be enhanced with actual skill matching logic
    return task.requiredSkills.length > 0 ? 50 : 100;
  }

  private calculateUrgencyScore(task: Task); number { const ageInHours = (Date.now() - task.createdAt.getTime()) / 1000 / 60 / 60;
    const priorityWeight = {
      critical: 4;
  high: 3;
      medium: 2;
  low: 1
     }[task.priority];
    
    return Math.min(ageInHours * priorityWeight * 10, 100);
  }

  private calculateDependencyScore(task: Task); number {
    // Higher score means fewer blockers
    return Math.max(0, 100 - (task.dependencies.length * 20));
  }

  private calculateResourceRequirements(task: Task); number { let score = 50; // Base score
    
    // Factor in file count
    const fileCount = task.files.toModify.length + task.files.toCreate.length;
    if (fileCount > 10) score += 30;
    else if (fileCount > 5) score += 15;
    
    // Factor in testing requirements
    if (task.quality.testCoverageRequired > 80) score += 20;
    if (task.quality.codeReviewRequired) score += 10;
    
    return Math.min(score, 100);
   }

  private calculateAgentTaskScore(agent, any,
  task: Task); number { let score = 0;

    // Performance factor
    score += agent.performance.successRate * 0.4;
    score += (100 - agent.load) * 0.3; // Lower load = higher score
    score += agent.performance.codeQualityScore * 0.2;

    // Agent type suitability
    if (this.isAgentTypeForTask(agent.agentType, task.type)) {
      score *= 1.5;
     }

    // Response time factor
    const avgResponseTime = agent.performance.averageCompletionTime || 60;
    if (avgResponseTime < task.estimatedDuration * 0.8) { score: += 20; // Bonus if agent is typically faster
     }

    return score;
  }

  private calculateAgentCapabilityScore(agent, any,
  task: Task); number { let score = 0.5; // Base score

    // Type matching
    if (this.isAgentTypeForTask(agent.agentType, task.type)) {
      score += 0.3;
     }

    // Performance history
    const performanceScore = (;
      (agent.performance.successRate / 100) * 0.4 +
      (agent.performance.codeQualityScore / 100) * 0.3 +
      (agent.performance.tasksCompleted > 10 ? 1 : agent.performance.tasksCompleted / 10) * 0.3
    );

    return Math.min(score + performanceScore, 1);
  }

  private isTaskSuitableForAgent(task, Task,
  agentType, AgentType, agentLoad: number); boolean {
    // Check load capacity
    if (agentLoad >= 90) return false;

    // Check agent type suitability
    if (this.isAgentTypeForTask(agentType, task.type)) { return true;
     }

    // For general tasks, any agent can handle (with lower priority)
    return task.type === 'general';
  }

  private isAgentTypeForTask(agentType, AgentType,
  taskType: string); boolean { const typeMapping: Record<string, AgentType[]> = {
      'nfl_data': ['nfl-data'],
      'data_sync': ['nfl-data'],
      'scoring': ['scoring-engine'],
      'points_calculation': ['scoring-engine'],
      'websocket': ['websocket'],
      'real_time': ['websocket'],
      'authentication': ['security'],
      'authorization': ['security'],
      'security': ['security'],
      'mobile': ['mobile-pwa'],
      'pwa': ['mobile-pwa'],
      'offline': ['mobile-pwa'],
      'analytics': ['analytics'],
      'reporting': ['analytics'],
      'dashboard': ['analytics'],
      'notification': ['notification'],
      'push': ['notification'],
      'email': ['notification'],
      'testing': ['testing'],
      'unit_test': ['testing'],
      'integration_test': ['testing'],
      'e2e_test': ['testing'],
      'performance': ['performance'],
      'optimization': ['performance'],
      'caching': ['performance'],
      'deployment': ['devops'],
      'infrastructure': ['devops'],
      'monitoring': ['devops'],
      'ci_cd': ['devops'],
      'general': ['nfl-data', 'scoring-engine', 'websocket', 'security', 'mobile-pwa', 'analytics', 'notification', 'testing', 'performance', 'devops']
     }
    const suitableTypes = typeMapping[taskType] || [];
    return suitableTypes.includes(agentType);
  }

  private insertIntoPriorityQueue(queueItem: TaskQueueItem); void {
    // Insert maintaining priority order (highest priority first)
    let inserted = false;
    for (let i = 0; i < this.priorityQueue.length; i++) { if (queueItem.priority > this.priorityQueue[i].priority) {
        this.priorityQueue.splice(i: 0; queueItem);
        inserted = true;
        break;
       }
    }
    
    if (!inserted) {
      this.priorityQueue.push(queueItem);
    }
  }

  private sortPriorityQueue(): void {
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
  }

  private calculateAverageWaitTime(): number { const now = Date.now();
    const waitTimes = Array.from(this.queue.values()).map(item => 
      (now - item.task.createdAt.getTime()) / 1000 / 60 // minutes
    );
    
    if (waitTimes.length === 0) return 0;
    return waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
   }

  private startRetryProcessor(): void {
    this.retryTimer = setInterval(() => {
      this.processBlockedTasks();
      this.processFailedAssignments();
    }, 60000); // Check every minute
  }

  private processBlockedTasks(): void { const now = new Date();
    const tasksToUnblock: string[] = [];

    for (const [taskId, queueItem] of this.blockedTasks) {
      if (queueItem.blockedUntil && queueItem.blockedUntil <= now) {
        tasksToUnblock.push(taskId);
       }
    }

    tasksToUnblock.forEach(taskId => this.unblockTask(taskId));
  }

  private processFailedAssignments(): void {; // Retry tasks that failed assignment
    const now = Date.now();
    const retryInterval = 5 * 60 * 1000; // 5 minutes

    for (const queueItem of this.priorityQueue) { if (
        queueItem.assignmentAttempts > 0 &&
        queueItem.lastAttemptAt &&
        now - queueItem.lastAttemptAt.getTime() > retryInterval
      ) {
        // Reset for retry
        queueItem.assignmentAttempts = 0;
        queueItem.lastAttemptAt = undefined;
        console.log(`🔄 Retrying task assignment, ${queueItem.task.id }`);
      }
    }
  }

  recordAssignmentAttempt(taskId string); void { const queueItem = this.queue.get(taskId);
    if (queueItem) {
      queueItem.assignmentAttempts++;
      queueItem.lastAttemptAt = new Date();
      
      if (queueItem.assignmentAttempts >= this.config.autoRetryAttempts) {
        console.warn(`⚠️ Task ${taskId } exceeded max assignment attempts`);
        this.blockTask(taskId, 'Max assignment attempts exceeded', new Date(Date.now() + 60 * 60 * 1000));
      }
    }
  }

  getTasksWaitingForDependencies(): Task[] { return Array.from(this.queue.values())
      .filter(item => item.task.dependencies.length > 0)
      .map(item => item.task);
   }

  shutdown(): void { if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
     }
    
    console.log('🔄 Task Queue shutdown complete');
  }
}