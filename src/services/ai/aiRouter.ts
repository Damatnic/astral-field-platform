// AI Router alias for compatibility
// Re-exports from the main router service and aiRouterService

// Export main router classes and interfaces
export { 
  AIRouterService as AIRouter, 
  AIRequest, 
  AIResponse, 
  AIProvider 
} from './router';

// Export aiRouterService types that other files expect
export type {
  AICapability,
  QueryComplexity,
  QueryPriority
} from './aiRouterService';

// Export main service instances
export { aiRouterService } from './aiRouterService';

// Default export
export { AIRouterService as default } from './router';