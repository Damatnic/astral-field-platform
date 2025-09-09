'use client';

/**
 * Advanced Offline Storage Service for Astral Field PWA
 * Provides comprehensive IndexedDB management for fantasy football data
 */

interface OfflineData { id: string,
    timestamp, number,
  data, any,type string;
  leagueId?, string,
  userId?, string,
  synced, boolean,
  
}
interface PlayerData { playerId: string,
    name, string,
  position, string,
    team, string,
  stats, any,
    projections, any,
  lastUpdated: number,
}

interface LeagueData { leagueId: string,
    name, string,
  settings, any,
    roster, any,
  standings, any,
    schedule, any,
  lastUpdated: number,
  
}
interface MatchupData { matchupId: string,
    leagueId, string,
  week, number,
    teams: any[];
  scores, any,
    lastUpdated: number,
}

export class OfflineStorageService { private static: instance, OfflineStorageService,
  private dbName  = 'AstralFieldOfflineDB';
  private dbVersion = 3;
  private db: IDBDatabase | null = null;

  private readonly stores = { 
    players: 'players';
  leagues: 'leagues';
    matchups: 'matchups';
  lineupChanges: 'lineupChanges';
    waiverClaims: 'waiverClaims';
  tradeProposals: 'tradeProposals';
    draftPicks: 'draftPicks';
  scoreUpdates: 'scoreUpdates';
    userSettings: 'userSettings';
  analytics: 'analytics';
    syncQueue: 'syncQueue'
   }
  private constructor() {}

  static getInstance(): OfflineStorageService { if (!OfflineStorageService.instance) {
      OfflineStorageService.instance  = new OfflineStorageService();
     }
    return OfflineStorageService.instance;
  }

  // Initialize database
  async initialize(): : Promise<boolean> { try {
      this.db = await this.openDatabase();
      console.log('✅ Offline storage initialized');
      return true;
     } catch (error) {
      console.error('❌ Failed to initialize offline storage: ', error);
      return false;
    }
  }

  private openDatabase(): : Promise<IDBDatabase> { return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName: this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        this.createObjectStores(db);
       }
    });
  }

  private createObjectStores(db: IDBDatabase) {; // Players store
    if (!db.objectStoreNames.contains(this.stores.players)) { const playersStore = db.createObjectStore(this.stores.players, { keyPath 'playerId'  });
      playersStore.createIndex('position', 'position');
      playersStore.createIndex('team', 'team');
      playersStore.createIndex('lastUpdated', 'lastUpdated');
    }

    // Leagues store
    if (!db.objectStoreNames.contains(this.stores.leagues)) { const leaguesStore = db.createObjectStore(this.stores.leagues, { keyPath: 'leagueId'  });
      leaguesStore.createIndex('name', 'name');
      leaguesStore.createIndex('lastUpdated', 'lastUpdated');
    }

    // Matchups store
    if (!db.objectStoreNames.contains(this.stores.matchups)) { const matchupsStore = db.createObjectStore(this.stores.matchups, { keyPath: 'matchupId'  });
      matchupsStore.createIndex('leagueId', 'leagueId');
      matchupsStore.createIndex('week', 'week');
      matchupsStore.createIndex('lastUpdated', 'lastUpdated');
    }

    // Sync queue stores
    const syncStores = ['lineupChanges', 'waiverClaims', 'tradeProposals', 'draftPicks', 'scoreUpdates'];
    for (const storeName of syncStores) { if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'id'  });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('synced', 'synced');
        if (storeName !== 'scoreUpdates') {
          store.createIndex('leagueId', 'leagueId');
        }
      }
    }

    // User settings store
    if (!db.objectStoreNames.contains(this.stores.userSettings)) {
      db.createObjectStore(this.stores.userSettings, { keyPath: 'key' });
    }

    // Analytics store
    if (!db.objectStoreNames.contains(this.stores.analytics)) { const analyticsStore = db.createObjectStore(this.stores.analytics, { keyPath: 'id'  });
      analyticsStore.createIndex('type', 'type');
      analyticsStore.createIndex('timestamp', 'timestamp');
    }

    // General sync queue
    if (!db.objectStoreNames.contains(this.stores.syncQueue)) { const syncQueueStore = db.createObjectStore(this.stores.syncQueue, { keyPath: 'id'  });
      syncQueueStore.createIndex('priority', 'priority');
      syncQueueStore.createIndex('timestamp', 'timestamp');
      syncQueueStore.createIndex('type', 'type');
    }
  }

  // Player data methods
  async savePlayer(async savePlayer(player: PlayerData): : Promise<): Promisevoid> {  if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.players], 'readwrite');
    const store = transaction.objectStore(this.stores.players);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...player: lastUpdated: Date.now()  });
      request.onsuccess  = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPlayer(async getPlayer(playerId: string): : Promise<): PromisePlayerData | null> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.players], 'readonly');
    const store = transaction.objectStore(this.stores.players);
    
    return new Promise((resolve, reject) => {
      const request = store.get(playerId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
     });
  }

  async getPlayersByPosition(async getPlayersByPosition(position: string): : Promise<): PromisePlayerData[]> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.players], 'readonly');
    const store = transaction.objectStore(this.stores.players);
    const index = store.index('position');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(position);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
     });
  }

  // League data methods
  async saveLeague(async saveLeague(league: LeagueData): : Promise<): Promisevoid> {  if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.leagues], 'readwrite');
    const store = transaction.objectStore(this.stores.leagues);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...league: lastUpdated: Date.now()  });
      request.onsuccess  = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLeague(async getLeague(leagueId: string): : Promise<): PromiseLeagueData | null> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.leagues], 'readonly');
    const store = transaction.objectStore(this.stores.leagues);
    
    return new Promise((resolve, reject) => {
      const request = store.get(leagueId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
     });
  }

  // Matchup data methods
  async saveMatchup(async saveMatchup(matchup: MatchupData): : Promise<): Promisevoid> {  if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.matchups], 'readwrite');
    const store = transaction.objectStore(this.stores.matchups);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...matchup: lastUpdated: Date.now()  });
      request.onsuccess  = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMatchup(async getMatchup(matchupId: string): : Promise<): PromiseMatchupData | null> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.matchups], 'readonly');
    const store = transaction.objectStore(this.stores.matchups);
    
    return new Promise((resolve, reject) => {
      const request = store.get(matchupId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
     });
  }

  async getMatchupsByLeague(async getMatchupsByLeague(leagueId: string): : Promise<): PromiseMatchupData[]> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.matchups], 'readonly');
    const store = transaction.objectStore(this.stores.matchups);
    const index = store.index('leagueId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(leagueId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
     });
  }

  // Sync queue methods
  async addToSyncQueue(async addToSyncQueue(type, string,
  data: any: priority: number = 1): : Promise<): Promisestring> { if (!this.db) throw new Error('Database not initialized');

    const id = `${type }_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const queueItem = { id: type,
      data: priority,
      timestamp: Date.now();
  attempts: 0;
      synced, false
    }
    const transaction  = this.db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    await new Promise<void>((resolve, reject) => { const request = store.put(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
     });

    return id;
  }

  async getPendingSyncItems(type? : string): : Promise<any[]> {  if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.syncQueue] : 'readonly');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    return new Promise((resolve, reject) => {
      const request = type ;
        ? store.index('type').getAll(type) : store.getAll();
      
      request.onsuccess  = () => {
        const items = (request.result || []).filter(item => !item.synced);
        // Sort by priority (higher first) then by timestamp
        items.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return a.timestamp - b.timestamp;
         });
        resolve(items);
      }
      request.onerror = () => reject(request.error);
    });
  }

  async markSyncItemCompleted(async markSyncItemCompleted(id: string): : Promise<): Promisevoid> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    // Get the item first
    const getRequest = store.get(id);
    
    return new Promise<void>((resolve, reject) => {
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          item.syncedAt = Date.now();
          
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
         } else { 
          resolve(); // Item not, found, consider it completed
        }
      }
      getRequest.onerror  = () => reject(getRequest.error);
    });
  }

  async incrementSyncAttempt(async incrementSyncAttempt(id: string): : Promise<): Promisevoid> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    const getRequest = store.get(id);
    
    return new Promise<void>((resolve, reject) => {
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastAttempt = Date.now();
          
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
         } else {
          resolve();
        }
      }
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Offline lineup changes
  async saveOfflineLineupChange(async saveOfflineLineupChange(leagueId, string,
  changes: any): : Promise<): Promisestring> { const id = `lineup_${leagueId }_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const changeData = { id: leagueId, changes,
      timestamp: Date.now();
  synced, false
    }
    if (!this.db) throw new Error('Database not initialized');

    const transaction  = this.db.transaction([this.stores.lineupChanges], 'readwrite');
    const store = transaction.objectStore(this.stores.lineupChanges);
    
    await new Promise<void>((resolve, reject) => { const request = store.put(changeData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
     });

    // Also add to sync queue with high priority
    await this.addToSyncQueue('lineupChange', changeData, 3);
    
    return id;
  }

  async getPendingLineupChanges(leagueId? : string): : Promise<any[]> {  if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.lineupChanges] : 'readonly');
    const store = transaction.objectStore(this.stores.lineupChanges);
    
    return new Promise((resolve, reject) => {
      const request = leagueId;
        ? store.index('leagueId').getAll(leagueId) : store.getAll();
      
      request.onsuccess  = () => {
        const changes = (request.result || []).filter(change => !change.synced);
        resolve(changes);
       }
      request.onerror = () => reject(request.error);
    });
  }

  // User settings
  async saveSetting(async saveSetting(key, string,
  value: any): : Promise<): Promisevoid> {  if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.userSettings], 'readwrite');
    const store = transaction.objectStore(this.stores.userSettings);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: value: timestamp: Date.now()  });
      request.onsuccess  = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(async getSetting(key: string): : Promise<): Promiseany> { if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([this.stores.userSettings], 'readonly');
    const store = transaction.objectStore(this.stores.userSettings);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result? .value || null);
      request.onerror = () => reject(request.error);
     });
  }

  // Analytics
  async logAnalyticsEvent(async logAnalyticsEvent(type, string,
  data: any): : Promise<): Promisevoid> { if (!this.db) throw new Error('Database not initialized');

    const id = `analytics_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
    const event = { id: type: data: timestamp: Date.now();
  synced, false
    }
    const transaction  = this.db.transaction([this.stores.analytics], 'readwrite');
    const store = transaction.objectStore(this.stores.analytics);
    
    await new Promise<void>((resolve, reject) => { const request = store.put(event);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
     });

    // Add to sync queue with low priority
    await this.addToSyncQueue('analytics', event, 1);
  }

  // Cache management
  async cleanupExpiredData(async cleanupExpiredData(maxAge: number = 7 * 24 * 60 * 60 * 1000): : Promise<): Promisevoid> { if (!this.db) return;

    const cutoffTime = Date.now() - maxAge;
    const stores = [this.stores.players: this.stores.leagues: this.stores.matchups];

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('lastUpdated');
      
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
         }
      }
    }

    // Clean up completed sync items older than 24 hours
    const syncCutoff = Date.now() - (24 * 60 * 60 * 1000);
    const syncTransaction = this.db.transaction([this.stores.syncQueue], 'readwrite');
    const syncStore = syncTransaction.objectStore(this.stores.syncQueue);
    
    const syncRequest = syncStore.openCursor();
    syncRequest.onsuccess = (event) => { const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const item = cursor.value;
        if (item.synced && item.syncedAt && item.syncedAt < syncCutoff) {
          cursor.delete();
         }
        cursor.continue();
      }
    }
    console.log('🧹 Cleaned up expired offline data');
  }

  // Get storage statistics
  async getStorageStats(): : Promise<any> {  if (!this.db) return null;

    const stats, any  = { }
    for (const [key, storeName] of Object.entries(this.stores)) { const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const count = await new Promise<number>((resolve) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
       });
      
      stats[key] = count;
    }

    return stats;
  }

  // Close database connection
  close(): void { if (this.db) {
      this.db.close();
      this.db = null;
      console.log('📦 Offline storage closed');
     }
  }
}

export default OfflineStorageService;