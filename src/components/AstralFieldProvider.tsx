"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccessibilityProvider } from "@/lib/accessibility/enhancements";
import { NotificationProvider } from "@/components/notifications/SmartNotifications";
import { KeyboardShortcutsProvider } from "@/components/ui/KeyboardShortcuts";
import { ServiceWorkerManager } from "@/lib/performance/optimizations";
import {
  AppInstallBanner, PWAStatusIndicator,
  PWALoadingSplash
} from "@/components/mobile/AppInstallBanner";
import { ScrollToTopButton } from "@/components/ui/MicroInteractions";
import { AutoStartTours } from "@/components/onboarding/OnboardingTour";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
  queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry, 3,
  refetchOnWindowFocus: false
},
    mutations: {
  retry: 1
}
}
});

interface AstralFieldProviderProps {
  children, ReactNode,
  userId?, string,
  leagueId?, string,
  
}
export function AstralFieldProvider({
  children, userId,
  leagueId
}: AstralFieldProviderProps) {; // Initialize service worker
  if (typeof window !== "undefined") { const swManager = ServiceWorkerManager.getInstance();
    swManager.register("/sw.js").catch(console.error);
   }

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <NotificationProvider>
          <KeyboardShortcutsProvider
            leagueId={leagueId}
            onNewTrade={() => {
              // Handle new trade action
              console.log("New trade triggered via keyboard shortcut");
            }}
            onOptimizeLineup={() => {
              // Handle lineup optimization
              console.log("Optimize lineup triggered via keyboard shortcut");
            }}
          >
            {/* PWA Loading Splash */}
            <PWALoadingSplash />

            {/* Main Content */}
            {children}

            {/* Global UI Components */}
            <GlobalUIComponents userId={userId} />

            {/* Auto-start onboarding tours */}
            {userId && <AutoStartTours userId={userId } />}
          </KeyboardShortcutsProvider>
        </NotificationProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}

// Global UI components that should appear on every page
function GlobalUIComponents({ userId  } { userId?: string  }) { return (
    <>
      {/* PWA Status Indicator */ }
      <PWAStatusIndicator />

      {/* Mobile App Install Banner */}
      <AppInstallBanner />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />

      {/* Service Worker Update Handler */}
      <ServiceWorkerUpdateHandler />
    </>
  );
}

// Component to handle service worker updates
function ServiceWorkerUpdateHandler() { if (typeof window === "undefined") return null;

  // Listen for service worker updates
  window.addEventListener("sw-update-available", (event: unknown) => {
    const swManager = ServiceWorkerManager.getInstance();

    // Show notification about update
    const shouldUpdate = confirm("A new version of Astral Field is available.Update now? The page will refresh.",
    );

    if (shouldUpdate) {
      swManager.skipWaiting();
     }
  });

  return null;
}

// Performance monitoring component
export function PerformanceMonitor({ children  }: { children: ReactNode  }) { if (process.env.NODE_ENV === "development") {; // Only monitor in development
    import("@/lib/performance/optimizations").then(
      ({ usePerformanceMonitor  }) => {
        // Initialize performance monitoring
      },
    );
  }

  return <>{children}</>;
}

// Error boundary component for the entire app
export function AstralFieldErrorBoundary({ children
} { children, ReactNode,
 }) { if (typeof window === "undefined") {
    return <>{children }</>;
  }

  return (
    <ErrorBoundaryComponent fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundaryComponent>
  );
}

function ErrorBoundaryComponent({ children,
  fallback
}: { children, ReactNode,
    fallback, ReactNode,
 }) {
  // This would be implemented with a proper error boundary class component
  // For now, just return children
  return <>{children}</>;
}

function ErrorFallback() { return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="text-6xl mb-4">🏈</div>
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-6">
          We apologize for the inconvenience.Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload() }
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
  Refresh, Page,
        </button>
      </div>
    </div>
  );
}

// Type definitions for the global app context
export interface AstralFieldContextType {
  userId?, string,
  leagueId?, string,
  preferences: {
  notifications, boolean,
    animations, boolean,
    sounds, boolean,
    theme: "dark" | "light" | "auto";
  }
}

// Hook to access the Astral Field context
export function useAstralField(): AstralFieldContextType {; // This would use a context provider in a real implementation
  return {
    preferences {
      notifications, true,
  animations, true,
      sounds, true,
  theme: "dark"
}
}
}

// Utility component for conditional rendering based on feature flags
export function FeatureFlag({ flag, children,
  fallback = null
}: { flag, string,
    children, ReactNode,
  fallback?, ReactNode,
 }) {// This would check against a feature flag system
  const isEnabled = true; // Placeholder

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Component for development-only features
export function DevOnly({ children  }: { children: ReactNode  }) { if (process.env.NODE_ENV !== "development") {
    return null;
   }

  return <>{children}</>;
}

// Component for production-only features
export function ProdOnly({ children  }: { children: ReactNode  }) { if (process.env.NODE_ENV === "development") {
    return null;
   }

  return <>{children}</>;
}

// Analytics wrapper component
export function AnalyticsProvider({ children  }: { children: ReactNode  }) {; // Initialize analytics in production
  if (process.env.NODE_ENV === "production") {
    // Initialize Google Analytics, PostHog, etc.
  }

  return <>{children}</>;
}

// Theme provider for consistent styling
export function ThemeProvider({ children  } { children: ReactNode  }) {; // Handle theme switching, CSS custom properties, etc.return <>{children}</>;
}

// Complete application wrapper
export function AstralFieldApp({ children, userId,
  leagueId
} { children, ReactNode,
  userId?, string,
  leagueId?, string,
 }) { return (
    <AstralFieldErrorBoundary>
      <ThemeProvider>
        <AnalyticsProvider>
          <PerformanceMonitor>
            <AstralFieldProvider userId={userId } leagueId={leagueId}>
              {children}
            </AstralFieldProvider>
          </PerformanceMonitor>
        </AnalyticsProvider>
      </ThemeProvider>
    </AstralFieldErrorBoundary>
  );
}
