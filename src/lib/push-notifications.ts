"use client";

export interface NotificationPayload {
  title: string;
  body: string;
  type: "trade" | "waiver" | "injury" | "score" | "lineup" | "general";
  priority: "low" | "normal" | "high" | "urgent";
  data?: {
    leagueId?: string;
    playerId?: string;
    tradeId?: string;
    url?: string;
    actionRequired?: boolean;
  };
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey =
    "BMvPgq8Zd4m6Eb1TG7gQ6XzHwV5dKkZxKQ8rN3sYpL9kM8fA2bE1cJ8dL6vR9tY3";

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeServiceWorker();
    }
  }

  private async initializeServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      console.log("🔔 Push Notifications: Service Worker registered");

      // Check for service worker updates
      this.swRegistration.addEventListener("updatefound", () => {
        const newWorker = this.swRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              this.notifyUpdateAvailable();
            }
          });
        }
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }

  private notifyUpdateAvailable() {
    // Notify user that app update is available
    if (
      window.confirm(
        "A new version of Astral Field is available. Refresh to update?",
      )
    ) {
      window.location.reload();
    }
  }

  async requestPermission(): Promise<"granted" | "denied" | "default"> {
    if (!("Notification" in window)) {
      console.warn("Push notifications not supported");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error("Service Worker not registered");
      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== "granted") {
      console.warn("Push notification permission not granted");
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log("🔔 Push subscription created:", subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error("❌ Failed to subscribe to push notifications:", error);
      return null;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription =
        await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        const unsubscribed = await subscription.unsubscribe();
        if (unsubscribed) {
          // Remove subscription from server
          await this.removeSubscriptionFromServer(subscription);
        }
        return unsubscribed;
      }
      return true;
    } catch (error) {
      console.error("❌ Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      return null;
    }

    return await this.swRegistration.pushManager.getSubscription();
  }

  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  // Show local notification (for testing or immediate feedback)
  showLocalNotification(payload: NotificationPayload) {
    if (!("Notification" in window)) {
      console.warn("Local notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn("Local notification permission not granted");
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      image: payload.image,
      tag: payload.tag,
      data: payload.data,
      requireInteraction:
        payload.requireInteraction || payload.priority === "urgent",
      silent: payload.silent,
      vibrate: payload.vibrate || this.getVibratePattern(payload.priority),
      timestamp: payload.timestamp || Date.now(),
    };

    if (payload.actions) {
      options.actions = payload.actions;
    }

    const notification = new Notification(payload.title, options);

    // Auto-close notification after delay (except for urgent ones)
    if (payload.priority !== "urgent" && !payload.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, this.getNotificationDuration(payload.priority));
    }

    return notification;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send subscription to server");
      }

      console.log("✅ Subscription sent to server");
    } catch (error) {
      console.error("❌ Failed to send subscription to server:", error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription) {
    try {
      const response = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove subscription from server");
      }

      console.log("✅ Subscription removed from server");
    } catch (error) {
      console.error("❌ Failed to remove subscription from server:", error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (const i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private getVibratePattern(priority: string): number[] {
    switch (priority) {
      case "urgent":
        return [200, 100, 200, 100, 200];
      case "high":
        return [200, 100, 200];
      case "normal":
        return [200, 100];
      default:
        return [100];
    }
  }

  private getNotificationDuration(priority: string): number {
    switch (priority) {
      case "urgent":
        return 0; // Never auto-close
      case "high":
        return 10000; // 10 seconds
      case "normal":
        return 7000; // 7 seconds
      default:
        return 5000; // 5 seconds
    }
  }

  // Predefined notification templates
  createTradeNotification(tradeDetails: {
    proposerTeam: string;
    receiverTeam: string;
    players: string[];
    tradeId: string;
    leagueId: string;
  }): NotificationPayload {
    return {
      title: "New Trade Proposal",
      body: `${tradeDetails.proposerTeam} wants to trade ${tradeDetails.players.join(", ")}`,
      type: "trade",
      priority: "high",
      data: {
        tradeId: tradeDetails.tradeId,
        leagueId: tradeDetails.leagueId,
        url: `/leagues/${tradeDetails.leagueId}/trades?id=${tradeDetails.tradeId}`,
        actionRequired: true,
      },
      actions: [
        { action: "view", title: "View Trade" },
        { action: "accept", title: "Accept" },
        { action: "decline", title: "Decline" },
      ],
      requireInteraction: true,
      tag: `trade-${tradeDetails.tradeId}`,
    };
  }

  createWaiverNotification(waiverDetails: {
    playerName: string;
    position: string;
    cost: number;
    leagueId: string;
  }): NotificationPayload {
    return {
      title: "Waiver Claim Processed",
      body: `You successfully claimed ${waiverDetails.playerName} (${waiverDetails.position}) for $${waiverDetails.cost}`,
      type: "waiver",
      priority: "normal",
      data: {
        leagueId: waiverDetails.leagueId,
        url: `/leagues/${waiverDetails.leagueId}/roster`,
      },
      actions: [{ action: "view", title: "View Roster" }],
      tag: `waiver-${waiverDetails.playerName}`,
    };
  }

  createInjuryNotification(injuryDetails: {
    playerName: string;
    position: string;
    team: string;
    status: string;
    playerId: string;
  }): NotificationPayload {
    return {
      title: "Player Injury Alert",
      body: `${injuryDetails.playerName} (${injuryDetails.position} - ${injuryDetails.team}) is ${injuryDetails.status}`,
      type: "injury",
      priority: "high",
      data: {
        playerId: injuryDetails.playerId,
        url: `/players/${injuryDetails.playerId}`,
      },
      actions: [
        { action: "view", title: "View Player" },
        { action: "find-replacement", title: "Find Replacement" },
      ],
      tag: `injury-${injuryDetails.playerId}`,
    };
  }

  createScoreUpdateNotification(scoreDetails: {
    playerName: string;
    points: number;
    gameStatus: string;
    leagueId: string;
  }): NotificationPayload {
    return {
      title: "Score Update",
      body: `${scoreDetails.playerName} has ${scoreDetails.points} points (${scoreDetails.gameStatus})`,
      type: "score",
      priority: "low",
      data: {
        leagueId: scoreDetails.leagueId,
        url: `/leagues/${scoreDetails.leagueId}/live`,
      },
      silent: true,
      tag: `score-${scoreDetails.playerName}`,
    };
  }

  createLineupReminderNotification(reminderDetails: {
    playersToSet: number;
    leagueId: string;
  }): NotificationPayload {
    return {
      title: "Lineup Reminder",
      body: `You have ${reminderDetails.playersToSet} player${reminderDetails.playersToSet > 1 ? "s" : ""} to set before games start`,
      type: "lineup",
      priority: "high",
      data: {
        leagueId: reminderDetails.leagueId,
        url: `/leagues/${reminderDetails.leagueId}/roster`,
        actionRequired: true,
      },
      actions: [{ action: "set-lineup", title: "Set Lineup" }],
      requireInteraction: true,
      tag: `lineup-${reminderDetails.leagueId}`,
    };
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
