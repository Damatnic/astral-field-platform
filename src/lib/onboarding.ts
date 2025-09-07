import { ReactNode } from "react";

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  showSkip?: boolean;
  showPrevious?: boolean;
  beforeShow?: () => Promise<void> | void;
  afterShow?: () => Promise<void> | void;
  beforeHide?: () => Promise<void> | void;
  afterHide?: () => Promise<void> | void;
  actionLabel?: string;
  actionHandler?: () => Promise<void> | void;
  spotlight?: boolean; // Highlight the target element
  allowClickOutside?: boolean;
  disableBeacon?: boolean;
  styles?: {
    spotlight?: React.CSSProperties;
    tooltip?: React.CSSProperties;
    overlay?: React.CSSProperties;
  };
}

export interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  autoStart?: boolean;
  showProgress?: boolean;
  showSkipAll?: boolean;
  locale?: {
    skip: string;
    previous: string;
    next: string;
    finish: string;
    close: string;
  };
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  onStepChange?: (stepIndex: number, step: OnboardingStep) => void;
}

// Built-in tours for different parts of the application
export const ONBOARDING_TOURS: Record<string, OnboardingTour> = {
  welcome: {
    id: "welcome",
    name: "Welcome to Astral Field",
    description: "Get started with your fantasy football journey",
    autoStart: true,
    showProgress: true,
    showSkipAll: true,
    steps: [
      {
        id: "welcome-intro",
        target: "body",
        title: "Welcome to Astral Field! 🏈",
        content: `
          <p>We're excited to have you join our fantasy football platform! This quick tour will show you the key features to get you started.</p>
          <p>You can skip this tour at any time, or revisit it from the help menu.</p>
        `,
        placement: "center",
        spotlight: false,
      },
      {
        id: "navigation",
        target: '[data-tour="navigation"]',
        title: "Navigation Menu",
        content: `
          <p>Use this menu to navigate between different sections:</p>
          <ul>
            <li><strong>Roster:</strong> Manage your team lineup</li>
            <li><strong>Players:</strong> Browse available players</li>
            <li><strong>Trades:</strong> Propose and manage trades</li>
            <li><strong>Waiver:</strong> Claim players from waivers</li>
          </ul>
        `,
        placement: "right",
        spotlight: true,
      },
      {
        id: "quick-actions",
        target: '[data-tour="floating-menu"]',
        title: "Quick Actions",
        content: `
          <p>This floating menu provides quick access to common actions from any page:</p>
          <ul>
            <li>Propose trades</li>
            <li>Optimize your lineup</li>
            <li>View live scores</li>
            <li>Add players</li>
          </ul>
          <p>The actions change based on what page you're on!</p>
        `,
        placement: "left",
        spotlight: true,
      },
      {
        id: "notifications",
        target: '[data-tour="notifications"]',
        title: "Notifications",
        content: `
          <p>Stay updated with real-time notifications about:</p>
          <ul>
            <li>Trade proposals and responses</li>
            <li>Waiver claim results</li>
            <li>Player injuries</li>
            <li>Game updates</li>
          </ul>
          <p>Click the bell icon to view all notifications and adjust your preferences.</p>
        `,
        placement: "left",
        spotlight: true,
      },
      {
        id: "keyboard-shortcuts",
        target: "body",
        title: "Keyboard Shortcuts",
        content: `
          <p>Power users can navigate quickly using keyboard shortcuts!</p>
          <p>Press <kbd>?</kbd> anytime to see all available shortcuts.</p>
          <p>Some popular ones:</p>
          <ul>
            <li><kbd>G</kbd> then <kbd>R</kbd> - Go to Roster</li>
            <li><kbd>G</kbd> then <kbd>P</kbd> - Go to Players</li>
            <li><kbd>/</kbd> - Focus search</li>
            <li><kbd>N</kbd> - New trade</li>
          </ul>
        `,
        placement: "center",
        spotlight: false,
      },
      {
        id: "mobile-app",
        target: "body",
        title: "Install the App",
        content: `
          <p>For the best experience, install Astral Field as an app on your device:</p>
          <ul>
            <li>✅ Works offline</li>
            <li>✅ Push notifications</li>
            <li>✅ Faster loading</li>
            <li>✅ Native app feel</li>
          </ul>
          <p>Look for the install prompt or check your browser's install options!</p>
        `,
        placement: "center",
        spotlight: false,
      },
    ],
  },

  "roster-management": {
    id: "roster-management",
    name: "Roster Management",
    description: "Learn how to manage your fantasy team",
    showProgress: true,
    steps: [
      {
        id: "roster-overview",
        target: '[data-tour="roster-overview"]',
        title: "Your Roster",
        content: `
          <p>This is your team roster. Here you can:</p>
          <ul>
            <li>View all your players</li>
            <li>Set your starting lineup</li>
            <li>Check player stats and projections</li>
          </ul>
        `,
        placement: "top",
        spotlight: true,
      },
      {
        id: "lineup-optimizer",
        target: '[data-tour="optimize-lineup"]',
        title: "Lineup Optimizer",
        content: `
          <p>Use the lineup optimizer to automatically set your best possible lineup based on:</p>
          <ul>
            <li>Player projections</li>
            <li>Injury status</li>
            <li>Matchup difficulty</li>
          </ul>
          <p>You can also manually drag and drop players to customize your lineup.</p>
        `,
        placement: "left",
        spotlight: true,
        actionLabel: "Try Optimizer",
        actionHandler: async () => {
          // Trigger lineup optimization
          const event = new CustomEvent("optimize-lineup");
          document.dispatchEvent(event);
        },
      },
      {
        id: "player-details",
        target: '[data-tour="player-card"]',
        title: "Player Information",
        content: `
          <p>Click on any player to see detailed information:</p>
          <ul>
            <li>Season stats and trends</li>
            <li>Upcoming matchups</li>
            <li>Injury reports</li>
            <li>Expert analysis</li>
          </ul>
        `,
        placement: "right",
        spotlight: true,
      },
      {
        id: "bench-management",
        target: '[data-tour="bench"]',
        title: "Bench Players",
        content: `
          <p>Your bench players are shown below your starting lineup.</p>
          <p>Keep an eye on their performance and injury status - you might need to make changes!</p>
        `,
        placement: "top",
        spotlight: true,
      },
    ],
  },

  trading: {
    id: "trading",
    name: "Trading System",
    description: "Master the art of fantasy football trading",
    showProgress: true,
    steps: [
      {
        id: "trade-center",
        target: '[data-tour="trade-center"]',
        title: "Trade Center",
        content: `
          <p>The Trade Center is your hub for all trading activity:</p>
          <ul>
            <li>View incoming trade proposals</li>
            <li>Check your sent trades</li>
            <li>Browse trade history</li>
          </ul>
        `,
        placement: "top",
        spotlight: true,
      },
      {
        id: "propose-trade",
        target: '[data-tour="propose-trade"]',
        title: "Propose a Trade",
        content: `
          <p>Start a new trade by selecting:</p>
          <ul>
            <li>The team you want to trade with</li>
            <li>Players you want to give</li>
            <li>Players you want to receive</li>
          </ul>
          <p>Our trade analyzer will help evaluate the fairness of the trade!</p>
        `,
        placement: "right",
        spotlight: true,
      },
      {
        id: "trade-analyzer",
        target: '[data-tour="trade-analyzer"]',
        title: "Trade Analyzer",
        content: `
          <p>The trade analyzer provides:</p>
          <ul>
            <li>Trade value assessment</li>
            <li>Position need analysis</li>
            <li>Projected impact on your team</li>
            <li>Fair trade suggestions</li>
          </ul>
        `,
        placement: "left",
        spotlight: true,
      },
    ],
  },

  "waiver-wire": {
    id: "waiver-wire",
    name: "Waiver Wire Guide",
    description: "Learn how to claim players from waivers",
    showProgress: true,
    steps: [
      {
        id: "available-players",
        target: '[data-tour="waiver-players"]',
        title: "Available Players",
        content: `
          <p>These are players not currently on any team's roster.</p>
          <p>You can filter and sort by:</p>
          <ul>
            <li>Position</li>
            <li>Projected points</li>
            <li>Recent performance</li>
            <li>Waiver priority</li>
          </ul>
        `,
        placement: "top",
        spotlight: true,
      },
      {
        id: "claim-priority",
        target: '[data-tour="waiver-priority"]',
        title: "Waiver Priority",
        content: `
          <p>Your waiver priority determines the order in which claims are processed.</p>
          <p>Lower numbers = higher priority</p>
          <p>Priority usually resets weekly or after successful claims.</p>
        `,
        placement: "right",
        spotlight: true,
      },
      {
        id: "make-claim",
        target: '[data-tour="claim-player"]',
        title: "Making a Claim",
        content: `
          <p>To claim a player:</p>
          <ol>
            <li>Click "Claim" on the player</li>
            <li>Select who to drop (if roster is full)</li>
            <li>Set your claim priority</li>
            <li>Submit your claim</li>
          </ol>
          <p>Claims are processed at designated times (usually Tuesday nights).</p>
        `,
        placement: "left",
        spotlight: true,
      },
    ],
  },
};

// Onboarding progress tracking
export interface OnboardingProgress {
  userId: string;
  completedTours: string[];
  skippedTours: string[];
  currentTour?: string;
  currentStep?: number;
  lastActive: Date;
  preferences: {
    showWelcomeTour: boolean;
    showFeatureHints: boolean;
    autoStartTours: boolean;
  };
}

// Storage keys
const ONBOARDING_STORAGE_KEY = "astral-field-onboarding";
const TOUR_SEEN_PREFIX = "tour-seen-";

// Utility functions
export function getOnboardingProgress(): OnboardingProgress {
  if (typeof window === "undefined") {
    return {
      userId: "",
      completedTours: [],
      skippedTours: [],
      lastActive: new Date(),
      preferences: {
        showWelcomeTour: true,
        showFeatureHints: true,
        autoStartTours: true,
      },
    };
  }

  const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastActive: new Date(parsed.lastActive),
      };
    } catch (error) {
      console.error("Failed to parse onboarding progress:", error);
    }
  }

  // Return default progress
  return {
    userId: "",
    completedTours: [],
    skippedTours: [],
    lastActive: new Date(),
    preferences: {
      showWelcomeTour: true,
      showFeatureHints: true,
      autoStartTours: true,
    },
  };
}

export function saveOnboardingProgress(progress: OnboardingProgress): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save onboarding progress:", error);
  }
}

export function markTourCompleted(tourId: string): void {
  const progress = getOnboardingProgress();
  if (!progress.completedTours.includes(tourId)) {
    progress.completedTours.push(tourId);
    progress.lastActive = new Date();
    saveOnboardingProgress(progress);
  }
}

export function markTourSkipped(tourId: string): void {
  const progress = getOnboardingProgress();
  if (!progress.skippedTours.includes(tourId)) {
    progress.skippedTours.push(tourId);
    progress.lastActive = new Date();
    saveOnboardingProgress(progress);
  }
}

export function isTourCompleted(tourId: string): boolean {
  const progress = getOnboardingProgress();
  return progress.completedTours.includes(tourId);
}

export function isTourSkipped(tourId: string): boolean {
  const progress = getOnboardingProgress();
  return progress.skippedTours.includes(tourId);
}

export function shouldShowTour(tourId: string): boolean {
  return !isTourCompleted(tourId) && !isTourSkipped(tourId);
}

export function resetOnboardingProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
}

export function updateOnboardingPreferences(
  preferences: Partial<OnboardingProgress["preferences"]>,
): void {
  const progress = getOnboardingProgress();
  progress.preferences = { ...progress.preferences, ...preferences };
  progress.lastActive = new Date();
  saveOnboardingProgress(progress);
}

// Feature discovery hints
export interface FeatureHint {
  id: string;
  target: string;
  title: string;
  content: string;
  showAfter?: number; // Show after X visits/actions
  expireAfter?: number; // Don't show after X days
  showOnPages?: string[]; // Only show on specific pages
  priority: "low" | "medium" | "high";
}

export const FEATURE_HINTS: FeatureHint[] = [
  {
    id: "keyboard-shortcuts-hint",
    target: "body",
    title: "Pro tip: Keyboard shortcuts!",
    content:
      'Press "?" to see all available keyboard shortcuts for faster navigation.',
    showAfter: 5,
    priority: "medium",
  },
  {
    id: "lineup-optimizer-hint",
    target: '[data-tour="optimize-lineup"]',
    title: "Try the lineup optimizer",
    content:
      "Let our AI suggest the best possible lineup based on projections and matchups.",
    showAfter: 3,
    showOnPages: ["/roster"],
    priority: "high",
  },
  {
    id: "trade-analyzer-hint",
    target: '[data-tour="trade-analyzer"]',
    title: "Trade smart with our analyzer",
    content:
      "Get instant analysis on trade fairness and impact before proposing.",
    showAfter: 2,
    showOnPages: ["/trades"],
    priority: "high",
  },
  {
    id: "mobile-app-hint",
    target: "body",
    title: "Install the mobile app",
    content:
      "Add Astral Field to your home screen for offline access and push notifications!",
    showAfter: 10,
    expireAfter: 30,
    priority: "medium",
  },
];

export function shouldShowFeatureHint(
  hintId: string,
  pageViews: number = 0,
  currentPath: string = "",
): boolean {
  const progress = getOnboardingProgress();
  if (!progress.preferences.showFeatureHints) return false;

  const hint = FEATURE_HINTS.find((h) => h.id === hintId);
  if (!hint) return false;

  // Check if already shown or dismissed
  const dismissedHints = JSON.parse(
    localStorage.getItem("dismissed-hints") || "[]",
  );
  if (dismissedHints.includes(hintId)) return false;

  // Check page restrictions
  if (
    hint.showOnPages &&
    !hint.showOnPages.some((page) => currentPath.includes(page))
  ) {
    return false;
  }

  // Check visit threshold
  if (hint.showAfter && pageViews < hint.showAfter) {
    return false;
  }

  // Check expiration
  if (hint.expireAfter) {
    const daysSinceFirstVisit =
      (new Date().getTime() - progress.lastActive.getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceFirstVisit > hint.expireAfter) {
      return false;
    }
  }

  return true;
}

export function dismissFeatureHint(hintId: string): void {
  if (typeof window === "undefined") return;

  const dismissed = JSON.parse(localStorage.getItem("dismissed-hints") || "[]");
  if (!dismissed.includes(hintId)) {
    dismissed.push(hintId);
    localStorage.setItem("dismissed-hints", JSON.stringify(dismissed));
  }
}
