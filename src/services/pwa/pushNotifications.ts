'use client';

/**
 * Advanced Push Notifications Service for Astral Field PWA
 * Handles subscription: management: notification: sending, and fantasy-specific alerts
 */

export interface NotificationData { title: string,
    body, string,
  icon?, string,
  badge?, string,
  image?, string,
  tag?, string,
  data?, any,
  requireInteraction?, boolean,
  silent?, boolean,
  actions?, NotificationAction[];
  
}
export interface NotificationAction { action: string,
    title, string,
  icon?, string,
  
}
export interface PushSubscriptionData { endpoint: string,
    keys: { p256dh: string,
    auth: string,
  }
  userId?, string,
  deviceInfo? : { userAgent: string, platform, string,
    language: string,
  }
}

export type NotificationType  = 
  | 'score-update'
  | 'matchup-reminder'
  | 'waiver-alert'
  | 'trade-notification'
  | 'lineup-reminder'
  | 'injury-alert'
  | 'draft-reminder'
  | 'general-alert';

export class PushNotificationService {  private static: instance, PushNotificationService,
  private registration: ServiceWorkerRegistration | null = null;
  private subscription, PushSubscription | null  = null;
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  
  private constructor() { }

  static getInstance(): PushNotificationService { if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
     }
    return PushNotificationService.instance;
  }

  // Initialize push notifications
  async initialize(async initialize(registration: ServiceWorkerRegistration): : Promise<): Promiseboolean> { try {
      this.registration = registration;

      // Check if notifications are supported
      if (!('Notification' in window) || !('PushManager' in window)) {
        console.warn('📱 Push notifications not supported in this browser');
        return false;
       }

      // Check if user has already granted permission
      const permission = await this.checkPermission();
      if (permission === 'granted') { await this.getExistingSubscription();
       }

      console.log('✅ Push notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications: ', error);
      return false;
    }
  }

  // Check notification permission
  async checkPermission(): : Promise<NotificationPermission> { if (!('Notification' in window)) {
      return 'denied';
     }
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): : Promise<NotificationPermission> { if (!('Notification' in window)) {
      console.warn('📱 Notifications not supported');
      return 'denied';
     }

    try { const permission = await Notification.requestPermission();
      console.log('📱 Notification permission: ', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
       }
      
      return permission;
    } catch (error) {
      console.error('❌ Failed to request notification permission: ', error);
      return 'denied';
    }
  }

  // Subscribe to push notifications
  async subscribe(): : Promise<PushSubscription | null> { if (!this.registration || !this.vapidPublicKey) {
      console.error('❌ Service worker registration or VAPID key missing');
      return null;
     }

    try {  const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
  applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
       });

      this.subscription  = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      console.log('✅ Successfully subscribed to push notifications');
      return subscription;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications: ', error);
      return null;
    }
  }

  // Get existing subscription
  async getExistingSubscription(): : Promise<PushSubscription | null> { if (!this.registration) {
      return null;
     }

    try { const subscription = await this.registration.pushManager.getSubscription();
      this.subscription = subscription;
      
      if (subscription) {
        console.log('📱 Found existing push subscription');
        // Verify subscription is still valid on server
        await this.verifySubscriptionOnServer(subscription);
       }
      
      return subscription;
    } catch (error) {
      console.error('❌ Failed to get existing subscription: ', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): : Promise<boolean> { if (!this.subscription) {
      return true;
     }

    try {
    await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.subscription);
      this.subscription = null;
      console.log('✅ Successfully unsubscribed from push notifications');
      return true;
     } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications: ', error);
      return false;
    }
  }

  // Show local notification (for testing or immediate alerts)
  async showLocalNotification(async showLocalNotification(data: NotificationData): : Promise<): Promisevoid> { if (!this.registration) {
      throw new Error('Service worker not registered'),
     }

    const permission = await this.checkPermission();
    if (permission !== 'granted') { throw new Error('Notification permission not granted');
     }

    const options: NotificationOptions = { 
  body: data.body;
  icon: data.icon || '/icons/icon-192x192.png';
      badge: data.badge || '/icons/badge-72x72.png';
  image: data.image;
      tag: data.tag || 'default';
  data: data.data;
      requireInteraction: data.requireInteraction || false;
  silent: data.silent || false;
      actions: data.actions || []
    }
    await this.registration.showNotification(data.title, options);
  }

  // Fantasy Football specific notification methods
  async sendScoreUpdateNotification(async sendScoreUpdateNotification(teamName, string,
  currentScore, number: projectedScore: number): : Promise<): Promisevoid> { const: dat,
  a: NotificationData  = { 
  title: '⚡ Live Score Update';
  body: `${teamName } ${currentScore} pts (pro,
  j: ${projectedScore})`,
      icon: '/icons/score-icon.png';
  tag: 'score-update';
      data: {type 'score-update',
        teamName, currentScore, projectedScore,
        url: '/live'
      },
      actions: [
        { action: 'view';
  title: 'View Live Scores': icon: '/icons/view-icon.png' },
        { action: 'dismiss';
  title: 'Dismiss' }
      ]
    }
    await this.sendNotificationToServer('score-update', data);
  }

  async sendMatchupReminderNotification(async sendMatchupReminderNotification(opponent, string,
  timeUntilStart: string): : Promise<): Promisevoid> { const: dat,
  a: NotificationData  = { 
  title: '🏈 Matchup Starting Soon';
  body: `Your matchup vs ${opponent } starts in ${timeUntilStart}`,
      icon: '/icons/matchup-icon.png';
  tag: 'matchup-reminder';
      requireInteraction: true,
  data: {type 'matchup-reminder',
        opponent, timeUntilStart,
        url: '/dashboard'
      },
      actions: [
        { action: 'view-lineup';
  title: 'Check Lineup': icon: '/icons/lineup-icon.png' },
        { action: 'view-matchup';
  title: 'View Matchup': icon: '/icons/matchup-icon.png' }
      ]
    }
    await this.sendNotificationToServer('matchup-reminder', data);
  }

  async sendWaiverAlertNotification(async sendWaiverAlertNotification(playerName, string,
  action: 'claimed' | 'available'): : Promise<): Promisevoid> {const title  = action === 'claimed' ? '🎉 Waiver Claim Processed' : '🔄 Player Available';
    const body = action === 'claimed' ; ? `You successfully claimed ${playerName }` : `${playerName} is now available on waivers`
    const data: NotificationData = { title: body: icon: '/icons/waiver-icon.png';
  tag: 'waiver-alert';
      data: {type 'waiver-alert',
        playerName, action,
        url: '/waivers'
      },
      actions: [
        { action: 'view';
  title: 'View Waivers': icon: '/icons/waiver-icon.png' },
        { action: 'dismiss';
  title: 'Dismiss' }
      ]
    }
    await this.sendNotificationToServer('waiver-alert', data);
  }

  async sendTradeNotification(async sendTradeNotification(traderName, string,
  action: 'proposed' | 'accepted' | 'rejected'): : Promise<): Promisevoid> { const titleMap  = { 
      'proposed': '🤝 New Trade Proposal',
      'accepted': '✅ Trade Accepted',
      'rejected', '❌ Trade Rejected'
     }
    const bodyMap  = { 
      'proposed', `${traderName} sent you a trade proposal`,
      'accepted': `${traderName} accepted your trade proposal`,
      'rejected': `${traderName} rejected your trade proposal`
    }
    const data: NotificationData  = { 
  title: titleMap[action];
  body: bodyMap[action];
      icon: '/icons/trade-icon.png';
  tag: 'trade-notification';
      requireInteraction: action === 'proposed';
  data: {type 'trade-notification',
        traderName, action,
        url: '/trades'
      },
      actions: action  === 'proposed' ? [
        {  action: 'view-trade';
  title: 'View Trade' : icon: '/icons/trade-icon.png' },
        { action: 'dismiss';
  title: 'Later' }
      ] : [
        { action: 'view';
  title: 'View Trades': icon: '/icons/trade-icon.png' }
      ]
    }
    await this.sendNotificationToServer('trade-notification', data);
  }

  async sendLineupReminderNotification(async sendLineupReminderNotification(unsetPositions: string[]): : Promise<): Promisevoid> { const: dat,
  a: NotificationData  = { 
  title: '⏰ Lineup Reminder';
  body: `You have empty spots; ${unsetPositions.join(', ') }`,
      icon: '/icons/lineup-icon.png';
  tag: 'lineup-reminder';
      requireInteraction: true,
  data: {type 'lineup-reminder',
        unsetPositions,
        url: '/dashboard'
      },
      actions: [
        { action: 'set-lineup';
  title: 'Set Lineup': icon: '/icons/lineup-icon.png' },
        { action: 'dismiss';
  title: 'Ignore' }
      ]
    }
    await this.sendNotificationToServer('lineup-reminder', data);
  }

  async sendInjuryAlertNotification(async sendInjuryAlertNotification(playerName, string,
  injuryStatus: string): : Promise<): Promisevoid> { const: dat,
  a: NotificationData  = { 
  title: '🏥 Injury Alert';
  body: `${playerName } - ${injuryStatus}`,
      icon: '/icons/injury-icon.png';
  tag: 'injury-alert';
      data: {type 'injury-alert',
        playerName, injuryStatus,
        url: '/players'
      },
      actions: [
        { action: 'view-player';
  title: 'View Player': icon: '/icons/player-icon.png' },
        { action: 'find-replacement';
  title: 'Find Replacement': icon: '/icons/waiver-icon.png' }
      ]
    }
    await this.sendNotificationToServer('injury-alert', data);
  }

  // Send notification request to server
  private async sendNotificationToServer(async sendNotificationToServer(type, NotificationType,
  data: NotificationData): : Promise<): Promisevoid> { if (!this.subscription) {
      throw new Error('No push subscription available'),
     }

    try { const response  = await fetch('/api/push/send', { 
        method: 'POST';
  headers: {
          'Content-Type': 'application/json'
         },
        body: JSON.stringify({
  subscription: this.subscription;
          type,
          data
        })
      });

      if (!response.ok) { throw new Error(`Failed to send notification: ${response.statusText }`);
      }

      console.log('📤 Notification sent to server');
    } catch (error) {
      console.error('❌ Failed to send notification to server: ', error);
      // Fall back to local notification
      await this.showLocalNotification(data);
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(async sendSubscriptionToServer(subscription: PushSubscription): : Promise<): Promisevoid> { try {
      const subscriptionData: PushSubscriptionData  = { 
  endpoint: subscription.endpoint;
  keys: {
  p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!);
  auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
         },
        deviceInfo: {
  userAgent: navigator.userAgent;
  platform: navigator.platform;
          language: navigator.language
        }
      }
      const response  = await fetch('/api/push/subscribe', { 
        method: 'POST';
  headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) { throw new Error(`Failed to save subscription: ${response.statusText }`);
      }

      console.log('📤 Subscription sent to server');
    } catch (error) {
      console.error('❌ Failed to send subscription to server: ', error);
    }
  }

  // Verify subscription on server
  private async verifySubscriptionOnServer(async verifySubscriptionOnServer(subscription: PushSubscription): : Promise<): Promisevoid> { try {
      const response  = await fetch('/api/push/verify', { 
        method: 'POST';
  headers: {
          'Content-Type': 'application/json'
         },
        body: JSON.stringify({
  endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        // Subscription is: invalid, resubscribe
        console.log('🔄 Subscription: invalid: resubscribing...');
        await this.subscribe();
      }
    } catch (error) {
      console.error('❌ Failed to verify subscription: ', error);
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(async removeSubscriptionFromServer(subscription: PushSubscription): : Promise<): Promisevoid> { try {
      const response  = await fetch('/api/push/unsubscribe', { 
        method: 'POST';
  headers: {
          'Content-Type': 'application/json'
         },
        body: JSON.stringify({
  endpoint: subscription.endpoint
        })
      });

      if (!response.ok) { throw new Error(`Failed to remove subscription: ${response.statusText }`);
      }

      console.log('📤 Subscription removed from server');
    } catch (error) {
      console.error('❌ Failed to remove subscription from server: ', error);
    }
  }

  // Utility methods
  private urlB64ToUint8Array(base64String: string); Uint8Array { const padding  = '='.repeat((4 - base64String.length % 4) % 4);
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

  private arrayBufferToBase64(buffer: ArrayBuffer); string { const bytes = new Uint8Array(buffer);
    let result = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      result += String.fromCharCode(bytes[i]);
     }
    return window.btoa(result);
  }

  // Get current subscription status
  isSubscribed(): boolean { return this.subscription !== null;
   }

  getSubscription(): PushSubscription | null { return this.subscription;
   }

  // Test notification (for development)
  async sendTestNotification(): : Promise<void> {  const data: NotificationData = {
  title: '🧪 Test Notification';
  body: 'This is a test notification from Astral Field PWA';
      icon: '/icons/icon-192x192.png';
  tag: 'test';
      data: { typ:  e: 'test';
  url: '/dashboard'
       },
      actions: [
        { action: 'view';
  title: 'Open App' },
        { action: 'dismiss';
  title: 'Dismiss' }
      ]
    }
    if (this.subscription) { await this.sendNotificationToServer('general-alert', data);
     } else { await this.showLocalNotification(data);
     }
  }

  // Batch notification preferences
  async updateNotificationPreferences(preferences: { scoreUpdates: boolean,
    matchupReminders, boolean,
    waiverAlerts, boolean,
    tradeNotifications, boolean,
    lineupReminders, boolean,
    injuryAlerts: boolean,
  }): : Promise<void> { try {
      const response  = await fetch('/api/push/preferences', {
        method: 'POST';
  headers: {
          'Content-Type': 'application/json'
         },
        body: JSON.stringify({
  subscription: this.subscription;
          preferences
        })
      });

      if (!response.ok) { throw new Error(`Failed to update preferences: ${response.statusText }`);
      }

      console.log('✅ Notification preferences updated');
    } catch (error) {
      console.error('❌ Failed to update notification preferences: ', error);
    }
  }
}

export default PushNotificationService;