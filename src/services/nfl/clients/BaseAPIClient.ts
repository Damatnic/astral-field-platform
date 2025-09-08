/**
 * Base API Client with Circuit Breaker Pattern and Intelligent Rate Limiting
 * Provides foundation for all NFL data source API clients
 */

import { EventEmitter } from 'events';

export interface APIClientConfig {
  name: string;
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerSecond?: number;
  };
  circuitBreaker?: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
  headers?: Record<string, string>;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  skipRateLimit?: boolean;
  skipCircuitBreaker?: boolean;
  headers?: Record<string, string>;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
  nextAttempt: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface RateLimiterState {
  requestsThisMinute: number;
  requestsThisSecond: number;
  minuteReset: number;
  secondReset: number;
  totalRequests: number;
  throttledRequests: number;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  circuitBreakerTrips: number;
  lastRequestTime: number;
  uptime: number;
  errorRate: number;
}

export class BaseAPIClient extends EventEmitter {
  protected config: APIClientConfig;
  protected circuitBreaker: CircuitBreakerState;
  protected rateLimiter: RateLimiterState;
  protected metrics: APIMetrics;
  protected responseTimes: number[] = [];
  private readonly maxResponseTimes = 100;
  private startTime = Date.now();

  constructor(config: APIClientConfig) {
    super();
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerSecond: 5
      },
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 300000 // 5 minutes
      },
      ...config
    };

    this.initializeCircuitBreaker();
    this.initializeRateLimiter();
    this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeCircuitBreaker(): void {
    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      nextAttempt: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
  }

  private initializeRateLimiter(): void {
    this.rateLimiter = {
      requestsThisMinute: 0,
      requestsThisSecond: 0,
      minuteReset: Date.now() + 60000,
      secondReset: Date.now() + 1000,
      totalRequests: 0,
      throttledRequests: 0
    };
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      circuitBreakerTrips: 0,
      lastRequestTime: 0,
      uptime: 0,
      errorRate: 0
    };
  }

  /**
   * Main request method with all protections
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check circuit breaker
      if (!options.skipCircuitBreaker && !this.isCircuitBreakerAllowed()) {
        throw new Error(`Circuit breaker is OPEN for ${this.config.name}`);
      }

      // Check rate limits
      if (!options.skipRateLimit && !this.isRateLimitAllowed()) {
        this.rateLimiter.throttledRequests++;
        this.metrics.rateLimitHits++;
        throw new Error(`Rate limit exceeded for ${this.config.name}`);
      }

      // Update rate limiter
      this.updateRateLimiter();

      // Make the actual request
      const response = await this.executeRequest<T>(endpoint, options);

      // Record success
      this.recordSuccess(Date.now() - startTime);
      
      return response;

    } catch (error) {
      // Record failure
      this.recordFailure(error, Date.now() - startTime);
      throw error;
    }
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const timeout = options.timeout || this.config.timeout!;
    const maxRetries = options.retries || this.config.retryAttempts!;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': `AstralField-NFL-Client/1.0 (${this.config.name})`,
          ...this.config.headers,
          ...options.headers
        };

        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        const fetchOptions: RequestInit = {
          method: 'GET',
          headers,
          signal: controller.signal
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Emit success event
        this.emit('request:success', {
          endpoint,
          attempt: attempt + 1,
          responseTime: Date.now() - (Date.now() - timeout)
        });

        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Emit retry event
        if (attempt < maxRetries) {
          this.emit('request:retry', {
            endpoint,
            attempt: attempt + 1,
            error: lastError.message,
            nextRetryIn: this.config.retryDelay! * Math.pow(2, attempt)
          });
        }

        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          break;
        }
      }
    }

    // Emit failure event
    this.emit('request:failed', {
      endpoint,
      attempts: maxRetries + 1,
      error: lastError!.message
    });

    throw lastError!;
  }

  private shouldNotRetry(error: Error): boolean {
    const nonRetryableErrors = [
      'Authentication',
      'Authorization',
      'Forbidden',
      '401',
      '403',
      '404'
    ];

    return nonRetryableErrors.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isCircuitBreakerAllowed(): boolean {
    const now = Date.now();
    const { state, nextAttempt } = this.circuitBreaker;

    switch (state) {
      case 'CLOSED':
        return true;
      
      case 'OPEN':
        if (now >= nextAttempt) {
          this.circuitBreaker.state = 'HALF_OPEN';
          return true;
        }
        return false;
      
      case 'HALF_OPEN':
        return true;
      
      default:
        return false;
    }
  }

  private isRateLimitAllowed(): boolean {
    const now = Date.now();
    
    // Reset counters if needed
    if (now >= this.rateLimiter.minuteReset) {
      this.rateLimiter.requestsThisMinute = 0;
      this.rateLimiter.minuteReset = now + 60000;
    }
    
    if (now >= this.rateLimiter.secondReset) {
      this.rateLimiter.requestsThisSecond = 0;
      this.rateLimiter.secondReset = now + 1000;
    }

    // Check limits
    const { rateLimit } = this.config;
    if (this.rateLimiter.requestsThisMinute >= rateLimit!.requestsPerMinute) {
      return false;
    }
    
    if (rateLimit!.requestsPerSecond && 
        this.rateLimiter.requestsThisSecond >= rateLimit!.requestsPerSecond) {
      return false;
    }

    return true;
  }

  private updateRateLimiter(): void {
    this.rateLimiter.requestsThisMinute++;
    this.rateLimiter.requestsThisSecond++;
    this.rateLimiter.totalRequests++;
  }

  private recordSuccess(responseTime: number): void {
    // Circuit breaker
    this.circuitBreaker.successfulRequests++;
    this.circuitBreaker.totalRequests++;
    
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      this.emit('circuit:closed', { client: this.config.name });
    }

    // Metrics
    this.metrics.successfulRequests++;
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = Date.now();
    
    this.recordResponseTime(responseTime);
    this.updateErrorRate();
  }

  private recordFailure(error: Error, responseTime: number): void {
    // Circuit breaker
    this.circuitBreaker.failedRequests++;
    this.circuitBreaker.totalRequests++;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (this.circuitBreaker.failures >= this.config.circuitBreaker!.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttempt = Date.now() + this.config.circuitBreaker!.recoveryTimeout;
      this.metrics.circuitBreakerTrips++;
      
      this.emit('circuit:opened', { 
        client: this.config.name, 
        failures: this.circuitBreaker.failures,
        error: error.message
      });
    }

    // Metrics
    this.metrics.failedRequests++;
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = Date.now();
    
    this.recordResponseTime(responseTime);
    this.updateErrorRate();

    this.emit('request:error', {
      client: this.config.name,
      error: error.message,
      responseTime
    });
  }

  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  private updateErrorRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
    }
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.metrics.uptime = Date.now() - this.startTime;
      
      // Reset circuit breaker failures periodically if in closed state
      if (this.circuitBreaker.state === 'CLOSED' && 
          Date.now() - this.circuitBreaker.lastFailureTime > this.config.circuitBreaker!.monitoringPeriod) {
        this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1);
      }

      // Emit metrics
      this.emit('metrics:updated', this.getMetrics());
    }, 60000); // Every minute
  }

  /**
   * Get current metrics
   */
  getMetrics(): APIMetrics & {
    circuitBreaker: CircuitBreakerState;
    rateLimiter: RateLimiterState;
  } {
    return {
      ...this.metrics,
      circuitBreaker: { ...this.circuitBreaker },
      rateLimiter: { ...this.rateLimiter }
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    metrics: APIMetrics;
  } {
    const issues: string[] = [];
    
    if (this.circuitBreaker.state === 'OPEN') {
      issues.push('Circuit breaker is open');
    }
    
    if (this.metrics.errorRate > 50) {
      issues.push('High error rate');
    }
    
    if (this.metrics.averageResponseTime > 5000) {
      issues.push('High response times');
    }
    
    const timeSinceLastRequest = Date.now() - this.metrics.lastRequestTime;
    if (timeSinceLastRequest > 300000) { // 5 minutes
      issues.push('No recent requests');
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics: this.metrics
    };
  }

  /**
   * Reset circuit breaker manually
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.nextAttempt = 0;
    this.emit('circuit:reset', { client: this.config.name });
  }

  /**
   * Test connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.makeRequest('/health', { skipCircuitBreaker: true, skipRateLimit: true });
      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<APIClientConfig> {
    return Object.freeze({ ...this.config });
  }
}

export { BaseAPIClient };