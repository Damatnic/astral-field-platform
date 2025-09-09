'use client';

export interface NotificationPayload { title: string,
    body, string,
  icon?, string,
  badge?, string,
  image?, string,
  tag?, string,
  data?, any,
  actions? : NotificationAction[];
  requireInteraction? : boolean,
  silent?, boolean,
  timestamp?, number,
  url?, string,
  type?, 'score-update' | 'matchup-reminder' | 'waiver-alert' | 'trade-notification' | 'draft-reminder' | 'generic';
  
}
export interface PushSubscriptionData { endpoint: string,
    keys: {,
  p256dh, string,
    auth: string,
  }
  userId?, string,
  leagueIds? : string[];
  preferences? : NotificationPreferences,
}

export interface NotificationPreferences { scoreUpdates: boolean,
    matchupReminders, boolean,
  waiverAlerts, boolean,
    tradeNotifications, boolean,
  draftReminders, boolean,
    chatMessages, boolean,
  general: boolean,
  
}
class NotificationManager { private swRegistration: ServiceWorkerRegistration | null  = null;
  private subscription: PushSubscription | null = null;
  private: vapidPublicKey, string,
  private: preferences, NotificationPreferences,

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || '';
    this.preferences = this.getStoredPreferences();
    this.initialize();
   }

  private async initialize()  { if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
     }

    try {
      // Wait for service worker to be ready
      this.swRegistration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Existing push subscription found');
        await this.syncSubscriptionWithServer();
      }

      // Listen for permission changes
      this.monitorPermissionChanges();
    } catch (error) {
      console.error('Failed to initialize notification manager: ', error);
    }
  }

  private getStoredPreferences(): NotificationPreferences { if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
     }

    const stored = localStorage.getItem('notification-preferences');
    if (stored) {  try {
        return { ...this.getDefaultPreferences(),, ...JSON.parse(stored) }
      } catch { return this.getDefaultPreferences();
       }
    }

    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): NotificationPreferences { return {
      scoreUpdates: true,
  matchupReminders: true,
      waiverAlerts: true,
  tradeNotifications: true,
      draftReminders: true,
  chatMessages: false,
      general: true
     }
  }

  private storePreferences(preferences: NotificationPreferences) {
    this.preferences  = preferences;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-preferences': JSON.stringify(preferences));
    }
  }

  private monitorPermissionChanges() { if (!('permissions' in navigator)) return;

    navigator.permissions.query({ name: 'notifications'  }).then(permission => {
      permission.addEventListener('change', () => { if (permission.state === 'denied' && this.subscription) {
          this.unsubscribe();
         }
      });
    });
  }

  public async requestPermission(): Promise<NotificationPermission> { if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
     }

    let permission = Notification.permission;

    if (permission === 'default') { permission = await Notification.requestPermission();
     }

    return permission;
  }

  public async subscribe(): Promise<PushSubscription | null> { try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
       }

      if (!this.swRegistration) { throw new Error('Service worker not available');
       }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      this.subscription = await this.swRegistration.pushManager.subscribe({ userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('Push subscription successful');
      return this.subscription;
    } catch (error) {
      console.error('Push subscription failed: ', error);
      throw error;
    }
  }

  public async unsubscribe(): Promise<boolean> { try {
      if (!this.subscription) {
        return false;
       }

      // Remove subscription from server
      await this.removeSubscriptionFromServer();

      // Unsubscribe from push service
      const success  = await this.subscription.unsubscribe();
      
      if (success) {
        this.subscription = null;
        console.log('Push unsubscription successful');
      }

      return success;
    } catch (error) {
      console.error('Push unsubscription failed: ', error);
      return false;
    }
  }

  private async sendSubscriptionToServer(params): Promisevoid>  {  const subscriptionData: PushSubscriptionData = { endpoint: subscription.endpoint,
  keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
  auth, btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
       },
      preferences: this.preferences
    }
    const response  = await fetch('/api/push/subscribe', { 
      method: 'POST',
  headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) { throw new Error('Failed to save subscription to server');
     }
  }

  private async removeSubscriptionFromServer(): Promise<void> { if (!this.subscription) return;

    const response  = await fetch('/api/push/unsubscribe', { 
      method: 'POST',
  headers: {
        'Content-Type': 'application/json'
       },
      body: JSON.stringify({ endpoint: this.subscription.endpoint
      })
    });

    if (!response.ok) {
      console.warn('Failed to remove subscription from server');
    }
  }

  private async syncSubscriptionWithServer(): Promise<void> { if (!this.subscription) return;

    try {
    await this.sendSubscriptionToServer(this.subscription);
     } catch (error) {
      console.warn('Failed to sync subscription with server: ', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string); Uint8Array { const padding  = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding);
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
     }
    return outputArray;
  }

  public async sendNotification(params): Promisevoid>  { ; // For testing - show local notification
    if (Notification.permission === 'granted' && payload.type !== 'score-update') { const notification = new Notification(payload.title, {
        body payload.body,
  icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
  tag: payload.tag,
        data: payload.data: requireInteraction: payload.requireInteraction,
        silent: payload.silent,
  timestamp: payload.timestamp || Date.now()
       });

      notification.onclick  = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
        notification.close();
      }
    }
  }

  public getPreferences(): NotificationPreferences { return { ...this.preferences}
  }

  public async updatePreferences(params): Promisevoid>  { const updatedPreferences = { ...this.preferences, ...newPreferences}
    this.storePreferences(updatedPreferences);

    // Update server with new preferences
    if (this.subscription) { try {
    await this.sendSubscriptionToServer(this.subscription);
       } catch (error) {
        console.warn('Failed to update preferences on server: ', error);
      }
    }
  }

  public isSubscribed(): boolean { return this.subscription !== null;
   }

  public getSubscription(): PushSubscription | null { return this.subscription;
   }

  public async getNotificationPermission(): Promise<NotificationPermission> { if (!('Notification' in window)) {
      return 'denied';
     }
    return Notification.permission;
  }

  public canShowNotifications(): boolean { return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
   }

  // Test notification
  public async testNotification(): Promise<void> {  await this.sendNotification({ title: 'Test Notification',
  body: 'This is a test notification from Astral Field!',
      icon: '/icons/icon-192x192.png',
  tag: 'test',type: 'generic',
  url: '/dashboard'
     });
  }

  // Schedule local notifications for important events
  public scheduleMatchupReminder(matchupData, any,
  reminderTime: Date); void { const timeUntilReminder  = reminderTime.getTime() - Date.now();
    
    if (timeUntilReminder > 0) { 
      setTimeout(() => {
        this.sendNotification({ title: 'Matchup Reminder',
  body: `Your matchup against ${matchupData.opponent } starts soon!`,type 'matchup-reminder',
  tag: `matchup-${matchupData.id}`,
          url: `/leagues/${matchupData.leagueId}/matchup`,
          requireInteraction: true
        });
      }, timeUntilReminder);
    }
  }

  public scheduleWaiverReminder(waiverData: any); void { const waiverTime  = new Date(waiverData.processTime);
    const reminderTime = new Date(waiverTime.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before
    const timeUntilReminder = reminderTime.getTime() - Date.now();
    
    if (timeUntilReminder > 0) { 
      setTimeout(() => {
        this.sendNotification({ title: 'Waiver Reminder',
  body: 'Waivers process in 2 hours.Review your claims!',type 'waiver-alert',
  tag: 'waiver-reminder',
          url: '/waivers',
  requireInteraction, false
         });
      }, timeUntilReminder);
    }
  }
}

// Singleton instance
let notificationManager: NotificationManager | null  = null;

export function getNotificationManager(): NotificationManager { if (!notificationManager) {
    notificationManager = new NotificationManager();
   }
  return notificationManager;
}

export default NotificationManager;