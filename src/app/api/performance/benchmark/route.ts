/**
 * Performance Benchmarking API Endpoint
 * Run performance benchmarks and load tests
 */

import { NextRequest } from 'next/server';
import { createCachedResponse } from '@/lib/cache';
import { performanceTestSuite, highPerformanceSystem } from '@/lib/performance';

export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json();
    
    switch (type) {
      case 'full-suite':
        const fullResults = await highPerformanceSystem.runPerformanceBenchmark();
        return createCachedResponse(fullResults, 300); // Cache for 5 minutes
        
      case 'database':
        const dbResults = await performanceTestSuite.benchmarkDatabase();
        return createCachedResponse({ 
          type: 'database',
          results: dbResults,
          timestamp: new Date().toISOString()
        }, 300);
        
      case 'cache':
        const cacheResults = await performanceTestSuite.benchmarkCache();
        return createCachedResponse({ 
          type: 'cache',
          results: cacheResults,
          timestamp: new Date().toISOString()
        }, 300);
        
      case 'stress-test':
        const stressResults = await performanceTestSuite.runSystemStressTest();
        return createCachedResponse({ 
          type: 'stress-test',
          results: stressResults,
          timestamp: new Date().toISOString()
        }, 300);
        
      default:
        return createCachedResponse(
          { error: 'Invalid benchmark type' },
          60,
          { status: 400 }
        );
    }
  } catch (error) {
    return createCachedResponse(
      { 
        error: 'Benchmark failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      30,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testName = url.searchParams.get('test');
    
    const runner = performanceTestSuite.getBenchmarkRunner();
    const results = testName ? 
      runner.getBenchmarkResults(testName) : 
      runner.getBenchmarkResults();
    
    return createCachedResponse(
      {
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      },
      60 // Cache for 1 minute
    );
  } catch (error) {
    return createCachedResponse(
      { error: 'Failed to fetch benchmark results' },
      30,
      { status: 500 }
    );
  }
}