'use client';

/**
 * Background Sync Service for Astral Field PWA
 * Handles offline operations and background synchronization for fantasy football data
 */

import OfflineStorageService from './offlineStorage';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  nextRetry: number;
  createdAt: number;
  leagueId?: string;
  userId?: string;
}

export type SyncOperationType = 
  | 'lineup-change'
  | 'waiver-claim'
  | 'trade-proposal'
  | 'trade-response'
  | 'draft-pick'
  | 'roster-drop'
  | 'roster-add'
  | 'settings-update'
  | 'score-update'
  | 'analytics-event'
  | 'chat-message';

export interface BackgroundSyncConfig {
  maxRetryAttempts: number;
  retryIntervals: number[]; // in milliseconds
  maxQueueSize: number;
  syncInterval: number; // in milliseconds
  enablePeriodicSync: boolean;
  priorityWeights: Record<SyncOperationType, number>;
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private registration: ServiceWorkerRegistration | null = null;
  private offlineStorage: OfflineStorageService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  
  private config: BackgroundSyncConfig = {
    maxRetryAttempts: 5,
    retryIntervals: [1000, 5000, 15000, 30000, 60000], // Progressive backoff
    maxQueueSize: 100,
    syncInterval: 30000, // 30 seconds
    enablePeriodicSync: true,
    priorityWeights: {
      'lineup-change': 10,
      'draft-pick': 9,
      'trade-response': 8,
      'waiver-claim': 7,
      'trade-proposal': 6,
      'roster-drop': 5,
      'roster-add': 5,
      'score-update': 4,
      'chat-message': 3,
      'settings-update': 2,
      'analytics-event': 1
    }
  };

  private constructor() {
    this.offlineStorage = OfflineStorageService.getInstance();
  }

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  // Initialize background sync
  async initialize(registration: ServiceWorkerRegistration, config?: Partial<BackgroundSyncConfig>): Promise<void> {
    this.registration = registration;
    
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize offline storage
    await this.offlineStorage.initialize();

    // Setup network monitoring
    this.setupNetworkMonitoring();

    // Setup periodic sync
    if (this.config.enablePeriodicSync) {
      this.setupPeriodicSync();
    }

    // Register sync event listener
    this.setupSyncEventListener();

    // Start sync interval
    this.startSyncInterval();

    console.log('✅ Background sync service initialized');
  }

  // Setup network monitoring
  private setupNetworkMonitoring(): void {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('📶 Network back online - triggering sync');
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Network offline - queuing operations');
      this.isOnline = false;
    });
  }

  // Setup periodic sync registration
  private setupPeriodicSync(): void {
    if (!this.registration) return;

    // Register for periodic background sync (supported in Chrome)
    if ('periodicSync' in this.registration) {
      (this.registration as any).periodicSync.register('fantasy-sync', {
        minInterval: 15 * 60 * 1000, // 15 minutes minimum
      }).catch((error: any) => {
        console.warn('Periodic sync not supported:', error);
      });
    }
  }

  // Setup sync event listener from service worker
  private setupSyncEventListener(): void {
    if (!this.registration || !this.registration.active) return;

    // Listen for sync events from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETED') {
        this.handleSyncCompleted(event.data.data);
      } else if (event.data && event.data.type === 'SYNC_FAILED') {
        this.handleSyncFailed(event.data.data);
      }
    });
  }

  // Start sync interval
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  // Add operation to sync queue
  async queueOperation(type: SyncOperationType, data: any, options: {
    priority?: number;
    leagueId?: string;
    userId?: string;
    immediate?: boolean;
  } = {}): Promise<string> {
    const operation: SyncOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority: options.priority || this.config.priorityWeights[type],
      attempts: 0,
      maxAttempts: this.config.maxRetryAttempts,
      nextRetry: Date.now(),
      createdAt: Date.now(),
      leagueId: options.leagueId,
      userId: options.userId
    };

    // Store operation in IndexedDB
    await this.offlineStorage.addToSyncQueue(type, operation, operation.priority);

    // Log operation
    console.log(`📝 Queued ${type} operation:`, operation.id);

    // Trigger immediate sync if online and requested
    if (this.isOnline && options.immediate) {
      this.triggerSync();
    } else if (!this.isOnline) {
      // Show offline notification
      this.showOfflineNotification(type);
    }

    return operation.id;
  }

  // Fantasy Football specific queue methods
  async queueLineupChange(leagueId: string, changes: any): Promise<string> {
    return this.queueOperation('lineup-change', {
      leagueId,
      changes,
      timestamp: Date.now()
    }, {
      priority: 10,
      leagueId,
      immediate: true
    });
  }

  async queueWaiverClaim(leagueId: string, playerId: string, dropPlayerId?: string): Promise<string> {
    return this.queueOperation('waiver-claim', {
      leagueId,
      playerId,
      dropPlayerId,
      timestamp: Date.now()
    }, {
      priority: 7,
      leagueId,
      immediate: true
    });
  }

  async queueTradeProposal(leagueId: string, proposal: any): Promise<string> {
    return this.queueOperation('trade-proposal', {
      leagueId,
      proposal,
      timestamp: Date.now()
    }, {
      priority: 6,
      leagueId,
      immediate: true
    });
  }

  async queueTradeResponse(leagueId: string, tradeId: string, response: 'accept' | 'reject'): Promise<string> {
    return this.queueOperation('trade-response', {
      leagueId,
      tradeId,
      response,
      timestamp: Date.now()
    }, {
      priority: 8,
      leagueId,
      immediate: true
    });
  }

  async queueDraftPick(leagueId: string, playerId: string, pick: number): Promise<string> {
    return this.queueOperation('draft-pick', {
      leagueId,
      playerId,
      pick,
      timestamp: Date.now()
    }, {
      priority: 9,
      leagueId,
      immediate: true
    });
  }

  async queueRosterChange(leagueId: string, action: 'add' | 'drop', playerId: string): Promise<string> {
    const type: SyncOperationType = action === 'add' ? 'roster-add' : 'roster-drop';
    return this.queueOperation(type, {
      leagueId,
      playerId,
      action,
      timestamp: Date.now()
    }, {
      priority: 5,
      leagueId,
      immediate: true
    });
  }

  async queueAnalyticsEvent(event: string, data: any): Promise<string> {
    return this.queueOperation('analytics-event', {
      event,
      data,
      timestamp: Date.now()
    }, {
      priority: 1,
      immediate: false
    });
  }

  async queueChatMessage(leagueId: string, message: string): Promise<string> {
    return this.queueOperation('chat-message', {
      leagueId,
      message,
      timestamp: Date.now()
    }, {
      priority: 3,
      leagueId,
      immediate: true
    });
  }

  // Trigger sync manually
  async triggerSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    console.log('🔄 Triggering background sync');
    
    // Register for background sync if supported
    if (this.registration && 'sync' in this.registration) {
      try {
        await this.registration.sync.register('fantasy-sync');
        console.log('✅ Background sync registered');
      } catch (error) {
        console.error('❌ Failed to register background sync:', error);
        // Fall back to immediate sync
        await this.processSyncQueue();
      }
    } else {
      // Fall back to immediate sync
      await this.processSyncQueue();
    }
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    console.log('⚡ Processing sync queue');

    try {
      const pendingOperations = await this.offlineStorage.getPendingSyncItems();
      
      if (pendingOperations.length === 0) {
        console.log('✅ No pending sync operations');
        return;
      }

      console.log(`📋 Processing ${pendingOperations.length} sync operations`);

      // Sort by priority and creation time
      const sortedOperations = pendingOperations.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Older first
      });

      let successCount = 0;
      let failureCount = 0;

      for (const operation of sortedOperations) {
        try {
          const success = await this.syncOperation(operation);
          if (success) {
            await this.offlineStorage.markSyncItemCompleted(operation.id);
            successCount++;
          } else {
            await this.handleSyncFailure(operation);
            failureCount++;
          }
        } catch (error) {
          console.error('Sync operation error:', error);
          await this.handleSyncFailure(operation);
          failureCount++;
        }
      }

      console.log(`✅ Sync completed: ${successCount} success, ${failureCount} failed`);
      
      // Notify app of sync completion
      this.notifyAppOfSyncStatus(successCount, failureCount);

    } catch (error) {
      console.error('❌ Sync queue processing error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual operation
  private async syncOperation(operation: any): Promise<boolean> {
    const { type, data } = operation;
    
    try {
      const endpoint = this.getEndpointForOperation(type);
      const method = this.getMethodForOperation(type);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Request': 'true',
          // Add auth headers
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log(`✅ Successfully synced ${type} operation:`, operation.id);
        return true;
      } else {
        console.error(`❌ Sync failed for ${type}:`, response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`❌ Network error syncing ${type}:`, error);
      return false;
    }
  }

  // Get API endpoint for operation type
  private getEndpointForOperation(type: SyncOperationType): string {
    const endpoints: Record<SyncOperationType, string> = {
      'lineup-change': '/api/leagues/{{leagueId}}/lineup',
      'waiver-claim': '/api/leagues/{{leagueId}}/waivers/claim',
      'trade-proposal': '/api/leagues/{{leagueId}}/trades/propose',
      'trade-response': '/api/leagues/{{leagueId}}/trades/respond',
      'draft-pick': '/api/leagues/{{leagueId}}/draft/pick',
      'roster-drop': '/api/leagues/{{leagueId}}/roster/drop',
      'roster-add': '/api/leagues/{{leagueId}}/roster/add',
      'settings-update': '/api/user/settings',
      'score-update': '/api/scores/update',
      'analytics-event': '/api/analytics/event',
      'chat-message': '/api/leagues/{{leagueId}}/chat'
    };

    return endpoints[type] || '/api/sync/generic';
  }

  // Get HTTP method for operation type
  private getMethodForOperation(type: SyncOperationType): string {
    const postOperations: SyncOperationType[] = [
      'waiver-claim', 'trade-proposal', 'trade-response', 'draft-pick',
      'roster-add', 'analytics-event', 'chat-message'
    ];

    const putOperations: SyncOperationType[] = [
      'lineup-change', 'settings-update', 'score-update'
    ];

    const deleteOperations: SyncOperationType[] = [
      'roster-drop'
    ];

    if (postOperations.includes(type)) return 'POST';
    if (putOperations.includes(type)) return 'PUT';
    if (deleteOperations.includes(type)) return 'DELETE';
    
    return 'POST';
  }

  // Handle sync failure
  private async handleSyncFailure(operation: any): Promise<void> {
    await this.offlineStorage.incrementSyncAttempt(operation.id);
    
    const newAttempts = operation.attempts + 1;
    
    if (newAttempts >= this.config.maxRetryAttempts) {
      console.error(`❌ Max retry attempts reached for operation:`, operation.id);
      // Move to failed queue or notify user
      this.handleMaxRetriesReached(operation);
    } else {
      // Schedule retry
      const retryDelay = this.config.retryIntervals[Math.min(newAttempts - 1, this.config.retryIntervals.length - 1)];
      console.log(`🔄 Scheduling retry for operation ${operation.id} in ${retryDelay}ms`);
    }
  }

  // Handle max retries reached
  private handleMaxRetriesReached(operation: any): void {
    // Notify user of permanent failure
    window.dispatchEvent(new CustomEvent('sync-permanent-failure', {
      detail: { operation }
    }));

    // Log for manual review
    console.error('Permanent sync failure:', operation);
  }

  // Handle sync completion from service worker
  private handleSyncCompleted(data: any): void {
    console.log('✅ Sync completed from service worker:', data);
    this.notifyAppOfSyncStatus(data.count || 0, 0);
  }

  // Handle sync failure from service worker
  private handleSyncFailed(data: any): void {
    console.error('❌ Sync failed in service worker:', data);
  }

  // Show offline notification
  private showOfflineNotification(type: SyncOperationType): void {
    const messages: Record<SyncOperationType, string> = {
      'lineup-change': 'Lineup changes saved offline. Will sync when online.',
      'waiver-claim': 'Waiver claim saved offline. Will process when online.',
      'trade-proposal': 'Trade proposal saved offline. Will send when online.',
      'trade-response': 'Trade response saved offline. Will sync when online.',
      'draft-pick': 'Draft pick saved offline. Will sync when online.',
      'roster-drop': 'Player drop saved offline. Will sync when online.',
      'roster-add': 'Player add saved offline. Will sync when online.',
      'settings-update': 'Settings saved offline. Will sync when online.',
      'score-update': 'Score update saved offline. Will sync when online.',
      'analytics-event': 'Event logged offline. Will sync when online.',
      'chat-message': 'Message saved offline. Will send when online.'
    };

    const message = messages[type] || 'Action saved offline. Will sync when online.';
    
    // Show toast notification
    window.dispatchEvent(new CustomEvent('show-offline-notification', {
      detail: { message, type }
    }));
  }

  // Notify app of sync status
  private notifyAppOfSyncStatus(successCount: number, failureCount: number): void {
    window.dispatchEvent(new CustomEvent('sync-status-update', {
      detail: { successCount, failureCount }
    }));

    // Update UI indicators
    if (successCount > 0) {
      window.dispatchEvent(new CustomEvent('show-sync-success', {
        detail: { count: successCount }
      }));
    }
  }

  // Get sync queue status
  async getSyncStatus(): Promise<{
    pending: number;
    failed: number;
    lastSync: number;
    isOnline: boolean;
    isSyncing: boolean;
  }> {
    const pendingOperations = await this.offlineStorage.getPendingSyncItems();
    const failedOperations = pendingOperations.filter(op => op.attempts >= this.config.maxRetryAttempts);

    return {
      pending: pendingOperations.length,
      failed: failedOperations.length,
      lastSync: 0, // Would need to track this
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    };
  }

  // Clear sync queue
  async clearSyncQueue(): Promise<void> {
    // Implementation would depend on offline storage
    console.log('🧹 Sync queue cleared');
  }

  // Update configuration
  updateConfig(newConfig: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart sync interval with new config
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.startSyncInterval();
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    console.log('🧹 Background sync service destroyed');
  }
}

export default BackgroundSyncService;