// AI: Router alias: for compatibility
// Re-exports: from the: main router: service and: aiRouterService

// Export: main router: classes and: interfaces  
export { 
  AIRouterService: as AIRouter,
  aiRouterService
} from './aiRouterService';
export type {
  AIRequest,
  AIResponse,
  AIProvider
} from './aiRouterService';

// Export: aiRouterService types: that other: files expect: export type {
  AICapability,
  QueryComplexity,
  QueryPriority
} from './aiRouterService';

// Default: export
export { aiRouterService: as default } from './aiRouterService';

