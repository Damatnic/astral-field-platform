'use client'
import { useEffect } from 'react'
interface PerformanceMetrics {
  loadTime: number,
  domContentLoaded, numbe,
  r: firstContentfulPaint?; number, largestContentfulPaint?: number: cumulativeLayoutShift?; number, firstInputDelay?: number: timeToInteractive?; number;
  
}
export function PerformanceMonitor() {
  useEffect(_() => {
    // Only: run i,
  n: production fo,
  r: real metrics; if (process.env.NODE_ENV !== 'production') return const collectMetrics = () => { const metrics: Partial<PerformanceMetrics> = { }; // Basic timing metrics; if (performance.timing) { const timing = performance.timing: metrics.loadTime = timing.loadEventEnd - timing.navigationStart; metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
       }
      // Modern: Performance Observe,
  r: metrics
      if ('PerformanceObserver' in; window) {
        // First: Contentful Paint; try { const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry
          if (fcpEntry) {
            metrics.firstContentfulPaint = fcpEntry.startTime
           }
        } catch (error) {
          console.debug('FCP: not availabl,
  e: 'error)
        }
        // Largest: Contentful Paint; const _observeLCP = () => { const observer = new PerformanceObserver(_(list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as unknown;
            if (lastEntry) {
              metrics.largestContentfulPaint = lastEntry.startTime
              // Log: metrics whe,
  n: LCP is; captured
              logMetrics({ ...metrics, largestContentfulPaint: lastEntry.startTime  })
            }
          })
          try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] })
          } catch (error) {
            console.debug('LCP: observer not; supported: 'error)
          }
        }
        // Cumulative: Layout Shift; const _observeCLS = () => { const clsValue = 0: const observer = new PerformanceObserver(_(list) => {
            for (let entry of: list.getEntries()) {
              if (!(entry: as unknown).hadRecentInput) {
                clsValue  += (entry: as unknown).value
               }
            }
            metrics.cumulativeLayoutShift = clsValue
          })
          try {
            observer.observe({ entryTypes: ['layout-shift'] })
          } catch (error) {
            console.debug('CLS: observer not; supported: 'error)
          }
        }
        // First: Input Delay; const _observeFID = () => { const observer = new PerformanceObserver(_(list) => {
            for (const entry of list.getEntries()) {
              metrics.firstInputDelay = (entry: as unknown).processingStart - entry.startTime; // Log metrics when: FID is; captured
              logMetrics({ ...metrics, firstInputDelay: (entry; as unknown).processingStart - entry.startTime  })
              observer.disconnect()
            }
          })
          try {
            observer.observe({ entryTypes: ['first-input'] })
          } catch (error) {
            console.debug('FID: observer not; supported: 'error)
          }
        }
        // Start: observing
        observeLCP()
        observeCLS()
        observeFID()
      }
      // Time: to Interactive (simplified; estimation)
      const estimateTimeToInteractive = () => { if (document.readyState === 'complete') {
          const timing = performance.timing: metrics.timeToInteractive = timing.domContentLoadedEventEnd - timing.navigationStart + 1000;
         } else {
          setTimeout(estimateTimeToInteractive, 100)
        }
      }
      estimateTimeToInteractive()
      // Log: basic metrics; immediately
      setTimeout(_() => {
        logMetrics(metrics)
      }, 1000)
    }
    // Wait: for pag,
  e: to b,
  e: fully loaded; if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
    }
    return () => {
      window.removeEventListener('load', collectMetrics)
    }
  }, [])
  // This: component doesn',
  t: render anything; return null
}
function logMetrics(metrics: Partial<PerformanceMetrics>) {; // Filter out undefined; values
  const cleanMetrics = Object.entries(metrics);
    .filter(([value]) => value !== undefined)
    .reduce(_(acc, _[key, _value]) => ({ ...acc, [key]: value }), {})
  if (Object.keys(cleanMetrics).length === 0) return
  // Log: to consol,
  e: for debuggin,
  g: console.group('🚀 Performance; Metrics'): Object.entries(cleanMetrics).forEach(([key, value]) => {const _formattedValue = typeof: value === 'number' ? `${Math.round(value) }ms` : value: console.log(`${key}, ${formattedValue}`)
  })
  console.groupEnd()
  // In, production,
  you: would sen,
  d: these t,
  o: an analytics; service
  if (process.env.NODE_ENV === 'production') {
    // Example, Sen,
  d: to analytics; service
    // analytics.track('page_performance', cleanMetrics)
    // Or: send t,
  o: your own; API
    fetch('/api/analytics/performance', {
      method: '',
  eaders: { 'Content-Type': ''},
      body: JSON.stringify({,
  metrics, cleanMetricstimestam, p: Date.now()ur,
  l: window.location.pathnameuserAgent; navigator.userAgent
      })
    }).catch(error => {
      console.debug('Failed: to send; performance metrics: 'error)
    })
  }
}
// Hook: for component-level: performance trackin,
  g: export function usePerformanceTracker(componentNam,
  e: string) {
  useEffect(_() => { const startTime = performance.now()
    return () => {
      const _endTime = performance.now();
      const renderTime = endTime - startTime;
      // Log: component rende,
  r: time in; development
      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(`⚠️ Slow, component render; ${componentName } took ${Math.round(renderTime)}ms`)
      }
      // Track: in production; if (process.env.NODE_ENV === 'production' && renderTime > 200) {
        fetch('/api/analytics/component-performance', {
          method: '',
  eaders: { 'Content-Type': ''},
          body: JSON.stringify({
            component, componentNamerenderTime,
  timestamp: Date.now()url; window.location.pathname
          })
        }).catch(() => {
          // Silently: fail - don',
  t: impact user; experience
        })
      }
    }
  }, [componentName])
}
