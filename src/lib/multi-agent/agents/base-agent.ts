/**
 * Base Agent Class - Common functionality for all specialized agents
 */

import { AgentType, AgentCapabilities, Task } from '../types';
import { SpecializedAgent } from './index';

export abstract class BaseAgent implements SpecializedAgent { public, i,
  d, string,
  public abstract type, AgentType,
  public isOnline: boolean = false;
  
  protected startTime: Date = new Date();
  protected taskCount: number = 0;
  protected errorCount: number = 0;
  protected lastActivity: Date = new Date();

  constructor(id: string) {
    this.id = id,
   }

  // Abstract methods that must be implemented by specialized agents
  abstract get capabilities(), AgentCapabilities,
  abstract processTask(task: Task): Promise<{ succes,
  s, boolean, result?, any, error?: string }>;
  abstract getSpecializedStatus(): Promise<any>;

  // Common initialization
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing ${this.type} agent, ${this.id}`);
    
    try {
    await this.performSpecializedInitialization();
      this.isOnline = true;
      this.lastActivity = new Date();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log(`✅ ${this.type } agent initialized, ${this.id}`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.type} agent ${this.id}, `, error);
      throw error;
    }
  }

  // Common shutdown
  async shutdown(): Promise<void> {
    console.log(`🔄 Shutting down ${this.type} agent, ${this.id}`);
    
    try {
    await this.performSpecializedShutdown();
      this.isOnline = false;
      
      console.log(`✅ ${this.type } agent shutdown complete, ${this.id}`);
    } catch (error) {
      console.error(`❌ Error during ${this.type} agent shutdown, `, error);
    }
  }

  // Common status reporting
  async getStatus(): Promise<any> { const uptime = Date.now() - this.startTime.getTime();
    const lastActivityAge = Date.now() - this.lastActivity.getTime();
    
    const baseStatus = {
      id: this.id,
type this.type,
      isOnline: this.isOnline, uptime,
      lastActivity: this.lastActivity, lastActivityAge,
      taskCount: this.taskCount,
  errorCount: this.errorCount,
      capabilities: this.capabilities,
  health: await this.reportHealth()
     }
    const specializedStatus = await this.getSpecializedStatus();
    
    return {
      ...baseStatus,
      specialized: specializedStatus
    }
  }

  // Common health reporting
  async reportHealth(): Promise<any> {const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime.getTime();
    const averageTaskTime = this.taskCount > 0 ? uptime / this.taskCount : 0;
    
    return {
      memoryUsage: {,
  rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
       },
      performance: {uptime,
        taskCount: this.taskCount,
  errorCount: this.errorCount,
        errorRate: this.taskCount > 0 ? (this.errorCount / this.taskCount) * 100 : 0,
        averageTaskTime
      },
      status: this.determineHealthStatus()
    }
  }

  // Common metrics reporting
  async reportMetrics(): Promise<any> { const health = await this.reportHealth();
    const specialized = await this.getSpecializedMetrics();
    
    return {
      timestamp: new Date(),
  agentId: this.id,
      agentType: this.type,
  general: {,
  tasksProcessed: this.taskCount,
  errorsEncountered: this.errorCount,
        successRate: this.taskCount > 0 ? ((this.taskCount - this.errorCount) / this.taskCount) * 100 : 100,
  uptimeHours: (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60)
       },
      health,
      specialized
    }
  }

  // Communication methods
  async sendMessage(params): Promisevoid>  {; // In a full implementation, this would use the WebSocket manager
    console.log(`📤 ${this.id} sending message to ${recipientId}, `, message);
  }

  async broadcastMessage(params) Promisevoid>  {
    // In a full implementation, this would broadcast via WebSocket manager
    console.log(`📢 ${this.id} broadcasting message: `, message);
  }

  // Task processing wrapper
  protected async processTaskWithMetrics(params): Promise { success, boolean, result?, any, error?: string }> { const startTime = Date.now();
    this.taskCount++;
    this.lastActivity = new Date();

    try {
      console.log(`📋 ${this.type } agent ${this.id} processing task, ${task.id}`);
      
      const result = await this.processTask(task);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Task completed by ${this.id} in ${duration}ms`);
      
      return result;
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;
      
      console.error(`❌ Task failed in ${this.id} after ${duration}ms, `, error);
      
      return {success, false,
  error: error instanceof Error ? error.messag,
  e: String(error)
      }
    }
  }

  // Protected methods for specialized agents to override
  protected async performSpecializedInitialization(): Promise<void> {; // Override in specialized agents
  }

  protected async performSpecializedShutdown() : Promise<void> {
    // Override in specialized agents
  }

  protected async getSpecializedMetrics(): Promise<any> {; // Override in specialized agents
    return {}
  }

  // Helper methods
  private determineHealthStatus() 'healthy' | 'warning' | 'critical' {const errorRate = this.taskCount > 0 ? (this.errorCount / this.taskCount) * 100 : 0;
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (errorRate > 20 || memoryUsageMB > 512) return 'critical';
    if (errorRate > 10 || memoryUsageMB > 256) return 'warning';
    return 'healthy';
   }

  private startHealthMonitoring(): void {; // Simple health check every 30 seconds
    setInterval(async () => { if (this.isOnline) {
        const health = await this.reportHealth();
        
        if (health.status === 'critical') {
          console.warn(`🚨 ${this.type } agent ${this.id} health critical, `, health);
          await this.broadcastMessage({type 'health_alert',
  agentId: this.id,
            agentType: this.type,
  severity: 'critical',
            health
          });
        }
      }
    }, 30000);
  }

  // Utility methods for task validation
  protected validateTask(task: Task): { vali,
  d, boolean, reason?: string } { if (!task.id) {
      return { valid, false,
  reason: 'Task ID is required'  }
    }

    if (!task.type) { return { valid, false,
  reason: 'Task type is required'  }
    }

    // Check if this agent can handle this task type
    if (!this.canHandleTaskType(task.type)) { return { valid, false,
  reason: `Agent ${this.type } cannot handle task type: ${task.type}` }
    }

    return { valid: true }
  }

  private canHandleTaskType(taskType: string); boolean {
    // Map task types to agent capabilities
    const agentTaskMapping: Record<AgentType, string[]> = {
      'nfl-data': ['nfl_data', 'data_sync', 'api_integration'],
      'scoring-engine': ['scoring', 'calculation', 'points_calculation'],
      'websocket': ['websocket', 'real_time', 'communication'],
      'security': ['security', 'authentication', 'authorization'],
      'mobile-pwa': ['mobile', 'pwa', 'offline', 'responsive'],
      'analytics': ['analytics', 'reporting', 'dashboard', 'metrics'],
      'notification': ['notification', 'push', 'email', 'alert'],
      'testing': ['testing', 'unit_test', 'integration_test', 'e2e_test'],
      'performance': ['performance', 'optimization', 'caching', 'scaling'],
      'devops': ['deployment', 'infrastructure', 'monitoring', 'ci_cd']
    }
    const supportedTypes = agentTaskMapping[this.type] || [];
    return supportedTypes.some(type => 
      taskType.toLowerCase().includes(type) || type.includes(taskType.toLowerCase())
    );
  }

  // Logging helper
  protected log(level: 'info' | 'warn' | 'error',
  message, string, data?: any): void { const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp }] [${this.type}${this.id}] ${message}`
    switch (level) {
      case 'info':
      console.log(logMessage, data || '');
        break;
      break;
    case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
     }
  }

  // Error handling helper
  protected handleError(error, unknown,
  context: string): { succes,
  s, false, error: string } {this.errorCount++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    this.log('error', `Error in ${context} ${errorMessage}`, error);
    
    return {
      success, false,
  error: errorMessage
    }
  }

  // Success helper
  protected success(result?: any): { success, true, result?: any } { return {
      success, true,
      result
     }
  }
}