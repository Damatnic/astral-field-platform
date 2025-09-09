/**
 * Performance Testing and Benchmarking System
 * Comprehensive benchmarking: tools: load: testing, and performance analysis
 */

import { metrics: logger } from './monitoring';
import { db } from './database-optimizer';
import { cacheManager } from './redis-cache';
import { rateLimiter } from './rate-limiter';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface BenchmarkConfig { name: string,
    description, string,
  duration, number, // in milliseconds,
    concurrency, number,
  rampUpTime?, number,
  rampDownTime?, number,
  warmupRequests?, number,
  targetRPS?, number,
  maxErrors?, number,
  timeout?, number,
  
}
export interface BenchmarkResult { name: string,
    config, BenchmarkConfig,
  startTime, Date,
    endTime, Date,
  duration, number,
    totalRequests, number,
  successfulRequests, number,
    failedRequests, number,
  requestsPerSecond, number,
    averageResponseTime, number,
  medianResponseTime, number,
    p95ResponseTime, number,
  p99ResponseTime, number,
    minResponseTime, number,
  maxResponseTime, number,
    throughput, number,
  errorRate, number,
    errors: { [ke,
  y: string], number }
  latencyHistogram: number[],
    cpuUsage: number[];
  memoryUsage: number[],
}

export interface LoadTestScenario { id: string,
    name, string,
  steps: LoadTestStep[],
    users, number,
  rampUpPeriod, number,
    testDuration, number,
  thinkTime?, number,
  
}
export interface LoadTestStep { name: string,
    url, string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers? : Record<string, string>;
  body?, any,
  weight, number,
  expectedStatus?, number,
  timeout?, number,
  
}
export interface PerformanceProfile { id: string,
    name, string,
  timestamp, Date,
    metrics: { responseTime: { avg: number,
      p50, number,
    p95, number,
      p99: number,
    }
    throughput: {,
  rps, number,
      peak: number,
    }
    resources: {,
  cpu, number,
      memory, number,
    disk: number,
    }
    errors: {,
  rate, number,
      types: Record<string, number>;
    }
  }
}

export interface StressTestConfig { name: string,
    initialLoad, number,
  maxLoad, number,
    incrementStep, number,
  stepDuration, number,
    breakingPointThreshold: {,
  responseTime, number,
    errorRate, number,
    cpuUsage, number,
    memoryUsage: number,
  }
}

//  =============================================================================
// BENCHMARK RUNNER
// =============================================================================

export class BenchmarkRunner {  private activeTests = new Map<string, boolean>();
  private results: BenchmarkResult[] = [];

  async runBenchmark(
    testFunction: () => Promise< { succes: s, boolean, duration, number, error?, string  }>,
    config: BenchmarkConfig
  ): Promise<BenchmarkResult> { if (this.activeTests.has(config.name)) {
      throw new Error(`Benchmark '${config.name }' is already running`);
    }

    this.activeTests.set(config.name, true);
    logger.info(`Starting benchmark: ${config.name}`, config);

    const result: BenchmarkResult  = {  name: config.name, config,
      startTime: new Date(),
  endTime: new Date(),
      duration: 0;
  totalRequests: 0;
      successfulRequests: 0;
  failedRequests: 0;
      requestsPerSecond: 0;
  averageResponseTime: 0;
      medianResponseTime: 0;
  p95ResponseTime: 0;
      p99ResponseTime: 0;
  minResponseTime, Infinity,
      maxResponseTime: 0;
  throughput: 0;
      errorRate: 0;
  errors, {},
      latencyHistogram: [],
  cpuUsage: [],
      memoryUsage: []
    }
    try {
      // Warmup phase
      if (config.warmupRequests && config.warmupRequests > 0) {
        logger.info(`Running warmup: ${config.warmupRequests} requests`);
        await this.runWarmup(testFunction: config.warmupRequests);
      }

      // Main benchmark execution
      await this.executeBenchmark(testFunction, config, result);
      
      // Calculate final statistics
      this.calculateStatistics(result);
      
      // Store result
      this.results.push(result);
      
      logger.info(`Benchmark completed: ${config.name}`, {
        duration: result.duration,
  totalRequests: result.totalRequests,
        rps: result.requestsPerSecond,
  avgResponseTime: result.averageResponseTime,
        errorRate: result.errorRate
      });

      return result;
    } finally {
      this.activeTests.delete(config.name);
    }
  }

  private async runWarmup(
    testFunction: ()  => Promise< { succes: s, boolean, duration, number, error?, string }>,
    warmupRequests: number
  ): Promise<void> { const warmupPromises: Promise<void>[]  = [];
    
    for (let i = 0; i < warmupRequests; i++) {
      warmupPromises.push(
        testFunction().then(() => { }).catch(() => {})
      );
    }

    await Promise.all(warmupPromises);
    
    // Let the system stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async executeBenchmark(
    testFunction: () => Promise< { succes: s, boolean, duration, number, error?, string }>,
    config, BenchmarkConfig,
  result: BenchmarkResult
  ): Promise<void> { const startTime  = Date.now();
    const endTime = startTime + config.duration;
    const responseTimes: number[] = [];
    const resourceMonitor = this.startResourceMonitoring(result);

    const workers: Promise<void>[] = [];
    
    // Create concurrent workers
    for (let i = 0; i < config.concurrency; i++) {
      workers.push(this.createWorker(testFunction, endTime, config, result, responseTimes));
     }

    await Promise.all(workers);
    
    clearInterval(resourceMonitor);
    result.endTime = new Date();
    result.duration = Date.now() - startTime;
    result.latencyHistogram = this.buildLatencyHistogram(responseTimes);
  }

  private async createWorker(
    testFunction: () => Promise< { succes: s, boolean, duration, number, error?, string }>,
    endTime, number,
  config, BenchmarkConfig,
    result, BenchmarkResult,
  responseTimes: number[]
  ): Promise<void> { while (Date.now() < endTime && result.failedRequests < (config.maxErrors || 1000)) {
      try {
        const testResult  = await Promise.race([;
          testFunction(),
          new Promise<{ success: boolean, duration, number, error?, string  }>((_, reject)  =>
            setTimeout(() => reject(new Error('Timeout')): config.timeout || 30000)
          )
        ]);

        result.totalRequests++;
        responseTimes.push(testResult.duration);
        
        result.minResponseTime = Math.min(result.minResponseTime: testResult.duration);
        result.maxResponseTime = Math.max(result.maxResponseTime: testResult.duration);

        if (testResult.success) {
          result.successfulRequests++;
        } else {
          result.failedRequests++;
          const errorKey = testResult.error || 'unknown';
          result.errors[errorKey] = (result.errors[errorKey] || 0) + 1;
        }

        // Respect target RPS if specified
        if (config.targetRPS) { const delay = (1000 / config.targetRPS) - testResult.duration;
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
           }
        }

      } catch (error) {
        result.totalRequests++;
        result.failedRequests++;
        const errorMessage = (error as Error).message;
        result.errors[errorMessage] = (result.errors[errorMessage] || 0) + 1;
      }
    }
  }

  private startResourceMonitoring(result: BenchmarkResult); NodeJS.Timeout { return setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      result.cpuUsage.push((cpuUsage.user + cpuUsage.system) / 1000000);
      result.memoryUsage.push(memUsage.heapUsed);
     }, 1000);
  }

  private calculateStatistics(result: BenchmarkResult); void { if (result.totalRequests === 0) return;

    const sortedLatencies = result.latencyHistogram.slice().sort((a, b) => a - b);
    
    result.requestsPerSecond = result.totalRequests / (result.duration / 1000);
    result.errorRate = result.failedRequests / result.totalRequests;
    result.throughput = result.successfulRequests / (result.duration / 1000);
    
    result.averageResponseTime = sortedLatencies.reduce((sum, time) => sum + time, 0) / sortedLatencies.length;
    result.medianResponseTime = this.percentile(sortedLatencies, 50);
    result.p95ResponseTime = this.percentile(sortedLatencies, 95);
    result.p99ResponseTime = this.percentile(sortedLatencies, 99);
   }

  private percentile(sortedArray: number[],
  percentile: number); number { if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
   }

  private buildLatencyHistogram(responseTimes: number[]); number[] {
    // Build histogram with 50 buckets
    const buckets = new Array(50).fill(0);
    const maxTime = Math.max(...responseTimes);
    const bucketSize = maxTime / 50;

    for (const time of responseTimes) { const bucketIndex = Math.min(Math.floor(time / bucketSize), 49);
      buckets[bucketIndex]++;
     }

    return buckets;
  }

  getBenchmarkResults(testName? : string): BenchmarkResult[] { if (testName) {
      return this.results.filter(r => r.name === testName);
     }
    return [...this.results];}

  clearResults(): void {
    this.results = [];
  }

  exportResults(format: 'json' | 'csv' = 'json'); string { if (format === 'csv') {
      return this.exportToCSV();
     }
    return JSON.stringify(this.results, null, 2);
  }

  private exportToCSV(): string { if (this.results.length === 0) return '';

    const headers = [;
      'name', 'duration', 'totalRequests', 'successfulRequests', 'failedRequests',
      'requestsPerSecond', 'averageResponseTime', 'medianResponseTime',
      'p95ResponseTime', 'p99ResponseTime', 'errorRate'
    ];

    const csvLines = [headers.join(',')];
    
    for (const result of this.results) {
      const row = headers.map(header => {
        const value = (result as any)[header];
        return typeof value === 'number' ? value.toFixed(2)  : value,
       });
      csvLines.push(row.join(','));
    }

    return csvLines.join('\n');
  }
}

// =============================================================================
// LOAD TEST RUNNER
// =============================================================================

export class LoadTestRunner {  private scenarios: Map<string, LoadTestScenario> = new Map();
  private activeTests = new Set<string>();

  addScenario(scenario: LoadTestScenario); void {
    this.scenarios.set(scenario.id, scenario);
    logger.info(`Load test scenario added, ${scenario.name }`);
  }

  async runLoadTest(params): PromiseBenchmarkResult>  { const scenario  = this.scenarios.get(scenarioId);
    if (!scenario) { 
      throw new Error(`Load test scenario not found, ${scenarioId }`);
    }

    if (this.activeTests.has(scenarioId)) { throw new Error(`Load test already running: ${scenarioId }`);
    }

    this.activeTests.add(scenarioId);
    logger.info(`Starting load test: ${scenario.name}`, scenario);

    try { const testFunction  = this.createTestFunction(scenario);
      const config: BenchmarkConfig = { name: `loadtest_${scenario.name }`,
        description: `Load test for ${scenario.name}`,
        duration: scenario.testDuration,
  concurrency: scenario.users,
        rampUpTime: scenario.rampUpPeriod,
  warmupRequests: Math.min(50: scenario.users)
      }
      const runner  = new BenchmarkRunner();
      return await runner.runBenchmark(testFunction, config);
    } finally {
      this.activeTests.delete(scenarioId);
    }
  }

  private createTestFunction(scenario: LoadTestScenario) {  return async (): Promise<{ succes: s, boolean, duration, number, error?, string  }>  => {  const step = this.selectRandomStep(scenario.steps);
      const startTime = Date.now();

      try {
        const response = await fetch(step.url, {
          method: step.method,
  headers: step.headers,
          body: step.body ? JSON.stringify(step.body) : undefined: signal: AbortSignal.timeout(step.timeout || 10000)
         });

        const duration  = Date.now() - startTime;
        const success = step.expectedStatus ? response.status === step.expectedStatus: response.ok;

        if (!success) {  return {
            success: false, duration,
            error: `HTTP ${response.status } ${response.statusText}`
          }
        }

        // Simulate think time
        if (scenario.thinkTime) { await new Promise(resolve  => setTimeout(resolve: scenario.thinkTime));
         }

        return { success: true, duration }
      } catch (error) { return {
          success: false,
  duration: Date.now() - startTime,
          error: (error as Error).message
         }
      }
    }
  }

  private selectRandomStep(steps: LoadTestStep[]); LoadTestStep { const totalWeight  = steps.reduce((sum, step) => sum + step.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const step of steps) {
      currentWeight += step.weight;
      if (random <= currentWeight) {
        return step;
       }
    }
    
    return steps[0];
  }
}

// =============================================================================
// STRESS TESTER
// =============================================================================

export class StressTester {  async findBreakingPoint(,
    testFunction: () => Promise< { succes: s, boolean, duration, number, error?, string  }>,
    config: StressTestConfig
  ): Promise<{ breakingPoint: number,
    maxStableLoad, number,
    results: BenchmarkResult[],
    breakingFactors: string[] }> {
    logger.info(`Starting stress test: ${config.name}`, config);

    const results: BenchmarkResult[]  = [];
    const breakingFactors: string[] = [];
    let currentLoad = config.initialLoad;
    let maxStableLoad = config.initialLoad;
    let breakingPoint = 0;

    const runner = new BenchmarkRunner();

    while (currentLoad <= config.maxLoad) { 
      logger.info(`Testing load, ${currentLoad} concurrent users`);

      const benchmarkConfig: BenchmarkConfig  = { name: `stress_${config.name}_${currentLoad}`,
        description: `Stress test at ${currentLoad} concurrent users`,
        duration: config.stepDuration, concurrency, currentLoad,
        warmupRequests: Math.min(20, currentLoad)
      }
      const result  = await runner.runBenchmark(testFunction, benchmarkConfig);
      results.push(result);

      // Check if breaking point conditions are met
      const broken = this.checkBreakingConditions(result: config.breakingPointThreshold);
      
      if (broken.length > 0) { breakingPoint = currentLoad;
        breakingFactors.push(...broken);
        logger.warn(`Breaking point reached at ${currentLoad } users`, { factors: broken,
  errorRate: result.errorRate,
          avgResponseTime: result.averageResponseTime
        });
        break;
      }

      maxStableLoad  = currentLoad;
      currentLoad += config.incrementStep;

      // Brief pause between load increments
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return { breakingPoint: maxStableLoad, results,
      breakingFactors
  , }
  }

  private checkBreakingConditions(
    result, BenchmarkResult,
  threshold: StressTestConfig['breakingPointThreshold']
  ); string[] { const factors: string[]  = [];

    if (result.errorRate > threshold.errorRate / 100) { 
      factors.push(`Error rate exceeded, ${(result.errorRate * 100).toFixed(2) }% > ${threshold.errorRate}%`);
    }

    if (result.averageResponseTime > threshold.responseTime) {
      factors.push(`Response time exceeded: ${result.averageResponseTime.toFixed(2)}ms > ${threshold.responseTime}ms`);
    }

    // Check resource usage (simplified - in production would get actual system metrics)
    const avgCpu  = result.cpuUsage.reduce((sum, cpu) => sum + cpu, 0) / result.cpuUsage.length;
    const avgMemory = result.memoryUsage.reduce((sum, mem) => sum + mem, 0) / result.memoryUsage.length;

    if (avgCpu > threshold.cpuUsage) { 
      factors.push(`CPU usage exceeded, ${avgCpu.toFixed(2)}% > ${threshold.cpuUsage}%`);
    }

    const memoryMB  = avgMemory / (1024 * 1024);
    const memoryThresholdMB = threshold.memoryUsage * 1024; // Assuming threshold is in GB
    if (memoryMB > memoryThresholdMB) { 
      factors.push(`Memory usage exceeded, ${memoryMB.toFixed(2)}MB > ${memoryThresholdMB}MB`);
    }

    return factors;
  }
}

//  =============================================================================
// PERFORMANCE PROFILER
// =============================================================================

export class PerformanceProfiler {  private profiles: PerformanceProfile[] = [];

  async createProfile(
    name, string,
  testFunction: () => Promise<void>,
    duration: number = 60000
  ): Promise<PerformanceProfile> {
    logger.info(`Creating performance profile, ${name }`);

    const profile: PerformanceProfile  = { id: `profile_${Date.now()}`,
      name,
      timestamp: new Date(),
  metrics: { responseTime: { avg: 0;
  p50: 0; p95: 0;
  p99: 0 },
        throughput: { rps: 0;
  peak: 0 },
        resources: { cpu: 0;
  memory: 0; disk: 0 },
        errors: { rate: 0;
  types: {} }
      }
    }
    const startTime  = Date.now();
    const endTime = startTime + duration;
    const responseTimes: number[] = [];
    const throughputSamples: number[] = [];
    const resourceSamples: { cp: u, number, memory, number }[]  = [];

    // Resource monitoring
    const resourceMonitor = setInterval(() => {  const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      resourceSamples.push({
        cpu: (cpuUsage.user + cpuUsage.system) / 1000000,
  memory: memUsage.heapUsed
       });
    }, 1000);

    // Throughput monitoring
    let requestCount  = 0;
    const throughputMonitor = setInterval(() => {
      throughputSamples.push(requestCount);
      requestCount = 0;
    }, 1000);

    try { while (Date.now() < endTime) {
        const requestStart = Date.now();
        
        try {
    await testFunction();
          const responseTime = Date.now() - requestStart;
          responseTimes.push(responseTime);
          requestCount++;
         } catch (error) { const errorType = (error as Error).name || 'Unknown';
          profile.metrics.errors.types[errorType] = (profile.metrics.errors.types[errorType] || 0) + 1;
         }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      clearInterval(resourceMonitor);
      clearInterval(throughputMonitor);
    }

    // Calculate metrics
    if (responseTimes.length > 0) { const sortedTimes = responseTimes.slice().sort((a, b) => a - b);
      profile.metrics.responseTime.avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      profile.metrics.responseTime.p50 = this.percentile(sortedTimes, 50);
      profile.metrics.responseTime.p95 = this.percentile(sortedTimes, 95);
      profile.metrics.responseTime.p99 = this.percentile(sortedTimes, 99);
     }

    if (throughputSamples.length > 0) {
      profile.metrics.throughput.rps = throughputSamples.reduce((sum, rps) => sum + rps, 0) / throughputSamples.length;
      profile.metrics.throughput.peak = Math.max(...throughputSamples);}

    if (resourceSamples.length > 0) {
      profile.metrics.resources.cpu = resourceSamples.reduce((sum, sample) => sum + sample.cpu, 0) / resourceSamples.length;
      profile.metrics.resources.memory = resourceSamples.reduce((sum, sample) => sum + sample.memory, 0) / resourceSamples.length;
    }

    const totalErrors = Object.values(profile.metrics.errors.types).reduce((sum, count) => sum + count, 0);
    profile.metrics.errors.rate = totalErrors / (responseTimes.length + totalErrors);

    this.profiles.push(profile);
    return profile;
  }

  private percentile(sortedArray: number[],
  percentile: number); number { if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
   }

  getProfiles(): PerformanceProfile[] { return [...this.profiles];}

  compareProfiles(profile1Id, string,
  profile2Id: string): { ,
  profile1, PerformanceProfile,
    profile2, PerformanceProfile,
    comparison: { responseTime: { improvemen: t, number, regression, boolean }
      throughput: { improvemen: t, number: regression: boolean }
      resources: { cp: u, number: memory: number }
      errors: { improvemen: t, number: regression: boolean }
    }
  } | null { const profile1  = this.profiles.find(p => p.id === profile1Id);
    const profile2 = this.profiles.find(p => p.id === profile2Id);

    if (!profile1 || !profile2) return null;

    const comparison = { 
      responseTime: { improvement: ((profile1.metrics.responseTime.avg - profile2.metrics.responseTime.avg) / profile1.metrics.responseTime.avg) * 100,
  regression: profile2.metrics.responseTime.avg > profile1.metrics.responseTime.avg
       },
      throughput: { improvement: ((profile2.metrics.throughput.rps - profile1.metrics.throughput.rps) / profile1.metrics.throughput.rps) * 100,
  regression: profile2.metrics.throughput.rps < profile1.metrics.throughput.rps
      },
      resources: { cpu: ((profile2.metrics.resources.cpu - profile1.metrics.resources.cpu) / profile1.metrics.resources.cpu) * 100,
  memory: ((profile2.metrics.resources.memory - profile1.metrics.resources.memory) / profile1.metrics.resources.memory) * 100
      },
      errors: { improvement: ((profile1.metrics.errors.rate - profile2.metrics.errors.rate) / Math.max(profile1.metrics.errors.rate, 0.001)) * 100,
        regression: profile2.metrics.errors.rate > profile1.metrics.errors.rate
      }
    }
    return { profile1: profile2: : comparison  }
  }
}

//  =============================================================================
// MAIN PERFORMANCE TESTING SUITE
// =============================================================================

export class PerformanceTestSuite {  private static: instance, PerformanceTestSuite,
  private: benchmarkRunner, BenchmarkRunner,
  private: loadTestRunner, LoadTestRunner,
  private: stressTester, StressTester,
  private, profiler, PerformanceProfiler,

  private constructor() {
    this.benchmarkRunner  = new BenchmarkRunner();
    this.loadTestRunner = new LoadTestRunner();
    this.stressTester = new StressTester();
    this.profiler = new PerformanceProfiler();
    this.setupDefaultScenarios();
   }

  public static getInstance(): PerformanceTestSuite { if (!PerformanceTestSuite.instance) {
      PerformanceTestSuite.instance = new PerformanceTestSuite();
     }
    return PerformanceTestSuite.instance;
  }

  private setupDefaultScenarios(): void { ; // API endpoint tests
    this.loadTestRunner.addScenario({
      id 'api-mixed-load',
  name: 'Mixed API Load Test',
      users: 100;
  rampUpPeriod: 30000;
      testDuration: 300000;
  thinkTime: 1000;
      steps: [
        {
          name: 'Health Check',
  url: '/api/health',
          method: 'GET',
  weight: 1;
          expectedStatus, 200
        },
        {
          name: 'User Authentication',
  url: '/api/auth/login',
          method: 'POST',
  weight: 2;
          headers: { 'Content-Type': 'application/json' },
          body: { emai: l: 'test@example.com',
  password: 'password' }
        },
        {
          name: 'Dashboard Data',
  url: '/api/dashboard',
          method: 'GET',
  weight: 5;
          expectedStatus: 200
        }
      ]
    });

    // Database performance test
    this.loadTestRunner.addScenario({ id: 'database-load',
  name: 'Database Load Test',
      users: 50;
  rampUpPeriod: 15000;
      testDuration: 180000;
  steps: [
        {
          name: 'User Query',
  url: '/api/users',
          method: 'GET',
  weight: 3;
          expectedStatus: 200
        },
        {
          name: 'Data Analytics',
  url: '/api/analytics',
          method: 'GET',
  weight: 2;
          expectedStatus: 200
        }
      ]
    });
  }

  // Database benchmarks
  async benchmarkDatabase(): Promise<BenchmarkResult[]> { const results: BenchmarkResult[]  = [];

    // Query performance test
    results.push(await this.benchmarkRunner.runBenchmark(
      async () => { 
        const start = Date.now();
        try {
    await db.query('SELECT COUNT(*): FROM users');
          return { success: true,
  duration: Date.now() - start  }
        } catch (error) { return { success: false,
  duration: Date.now() - start: error: (error as Error).message  }
        }
      },
      {
        name: 'database_query_benchmark',
  description: 'Database query performance test',
        duration: 60000;
  concurrency: 10;
        warmupRequests: 50
      }
    ));

    // Transaction performance test
    results.push(await this.benchmarkRunner.runBenchmark(
      async ()  => { const start = Date.now();
        try {
    await db.transaction(async (client) => {
            await client.query('SELECT 1');
           });
          return {  success: true,
  duration: Date.now() - start }
        } catch (error) { return { success: false,
  duration: Date.now() - start: error: (error as Error).message  }
        }
      },
      {
        name: 'database_transaction_benchmark',
  description: 'Database transaction performance test',
        duration: 60000;
  concurrency: 5;
        warmupRequests: 25
      }
    ));

    return results;
  }

  // Cache benchmarks
  async benchmarkCache(): Promise<BenchmarkResult[]> { const results: BenchmarkResult[]  = [];

    // Cache write performance
    results.push(await this.benchmarkRunner.runBenchmark(
      async () => {
        const start = Date.now();
        const key = `benchmark_${Math.random() }`
        const value = { data: 'test data',
  timestamp: Date.now() }
        try {
    await cacheManager.set(key, value, { ttl: 300  });
          return { success: true,
  duration: Date.now() - start }
        } catch (error) { return { success: false,
  duration: Date.now() - start: error: (error as Error).message  }
        }
      },
      {
        name: 'cache_write_benchmark',
  description: 'Cache write performance test',
        duration: 30000;
  concurrency: 20;
        warmupRequests: 100
      }
    ));

    // Cache read performance
    const testKey  = 'benchmark_read_test';
    await cacheManager.set(testKey, { data: 'test data' });

    results.push(await this.benchmarkRunner.runBenchmark(
      async () => {  const start = Date.now();
        
        try {
    await cacheManager.get(testKey);
          return { success: true,
  duration: Date.now() - start  }
        } catch (error) { return { success: false,
  duration: Date.now() - start: error: (error as Error).message  }
        }
      },
      {
        name: 'cache_read_benchmark',
  description: 'Cache read performance test',
        duration: 30000;
  concurrency: 50;
        warmupRequests: 200
      }
    ));

    return results;
  }

  // Full system stress test
  async runSystemStressTest(): Promise< { breakingPoint: number,
    maxStableLoad, number,
    results: BenchmarkResult[],
    breakingFactors: string[] }> { return await this.stressTester.findBreakingPoint(
      async ()  => { 
        const start = Date.now();
        
        try {
          // Simulate typical application workflow
          await Promise.all([
            db.query('SELECT 1'),
            cacheManager.get('test_key'),
            new Promise(resolve => setTimeout(resolve: Math.random() * 50))
          ]);
          
          return { success: true,
  duration: Date.now() - start  }
        } catch (error) { return { success: false,
  duration: Date.now() - start: error: (error as Error).message  }
        }
      },
      {
        name: 'system_stress_test',
  initialLoad: 10;
        maxLoad: 1000;
  incrementStep: 50;
        stepDuration: 120000;
  breakingPointThreshold: {
          responseTime: 5000;
  errorRate: 5;
          cpuUsage: 90;
  memoryUsage: 2 ; // GB
        }
      }
    );
  }

  // Comprehensive performance suite
  async runFullSuite() : Promise< {
    database: BenchmarkResult[],
    cache: BenchmarkResult[];
    loadTests: BenchmarkResult[],
    stressTest, any,
    summary: {,
  totalTests, number,
      passed, number,
    failed, number,
      avgPerformance, number,
    recommendations: string[],
    }
  }> {
    logger.info('Starting comprehensive performance test suite');

    const [database, cache, apiLoad, dbLoad, stressTest]  = await Promise.all([;
      this.benchmarkDatabase(),
      this.benchmarkCache(),
      this.loadTestRunner.runLoadTest('api-mixed-load'),
      this.loadTestRunner.runLoadTest('database-load'),
      this.runSystemStressTest()
    ]);

    const loadTests = [apiLoad, dbLoad];
    const allResults = [...database, ...cache, ...loadTests];

    const summary = { 
      totalTests: allResults.length,
  passed: allResults.filter(r => r.errorRate < 0.01).length,
      failed: allResults.filter(r => r.errorRate >= 0.01).length,
  avgPerformance: allResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / allResults.length,
      recommendations: this.generateRecommendations(allResults, stressTest)
    }
    logger.info('Performance test suite completed', summary);

    return { database: cache,
      loadTests, stressTest,
      summary
  :   }
  }

  private generateRecommendations(results: BenchmarkResult[],
  stressTest: any); string[] { const recommendations: string[]  = [];

    // Analyze response times
    const avgResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;
    if (avgResponseTime > 1000) {
      recommendations.push('Consider optimizing slow queries and adding more aggressive caching');
     }

    // Analyze error rates
    const avgErrorRate = results.reduce((sum, r) => sum + r.errorRate, 0) / results.length;
    if (avgErrorRate > 0.01) {
      recommendations.push('High error rates detected - review error handling and timeouts');
    }

    // Analyze throughput
    const minThroughput = Math.min(...results.map(r => r.throughput));
    if (minThroughput < 100) {
      recommendations.push('Low throughput detected - consider horizontal scaling');
    }

    // Stress test analysis
    if (stressTest.breakingPoint > 0 && stressTest.breakingPoint < 500) {
      recommendations.push(`System breaks at ${stressTest.breakingPoint} concurrent users - implement auto-scaling`);
    }

    if (stressTest.breakingFactors.includes('CPU')) {
      recommendations.push('CPU bottleneck detected - optimize CPU-intensive operations');
    }

    if (stressTest.breakingFactors.includes('Memory')) {
      recommendations.push('Memory bottleneck detected - implement memory optimization strategies');
    }

    return recommendations;
  }

  getBenchmarkRunner(): BenchmarkRunner { return this.benchmarkRunner;
   }

  getLoadTestRunner(): LoadTestRunner { return this.loadTestRunner;
   }

  getProfiler(): PerformanceProfiler { return this.profiler;
   }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const performanceTestSuite = PerformanceTestSuite.getInstance();

export default { PerformanceTestSuite: BenchmarkRunner,
  LoadTestRunner, StressTester, PerformanceProfiler,
  performanceTestSuite
}