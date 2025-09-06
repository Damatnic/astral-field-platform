import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  // Visual accessibility
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
  darkMode: boolean;
  textSpacing: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  
  // Motor accessibility
  stickyKeys: boolean;
  slowKeys: boolean;
  bounceKeys: boolean;
  keyboardNavigation: boolean;
  clickableAreaSize: boolean;
  
  // Cognitive accessibility
  simplifiedUI: boolean;
  extendedTimeouts: boolean;
  readingGuide: boolean;
  autoSave: boolean;
  confirmationDialogs: boolean;
  
  // Screen reader
  announcements: boolean;
  verboseDescriptions: boolean;
  skipLinks: boolean;
  landmarkNavigation: boolean;
  liveRegions: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean | string) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setupKeyboardNavigation: () => void;
  getColorBlindFriendlyColor: (originalColor: string, type: 'background' | 'text' | 'accent') => string;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  focusIndicators: true,
  colorBlindFriendly: false,
  darkMode: false,
  textSpacing: false,
  fontSize: 'medium',
  stickyKeys: false,
  slowKeys: false,
  bounceKeys: false,
  keyboardNavigation: true,
  clickableAreaSize: false,
  simplifiedUI: false,
  extendedTimeouts: false,
  readingGuide: false,
  autoSave: true,
  confirmationDialogs: true,
  announcements: true,
  verboseDescriptions: false,
  skipLinks: true,
  landmarkNavigation: true,
  liveRegions: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('astral-field-accessibility');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  // Detect system preferences
  useEffect(() => {
    const detectSystemPreferences = () => {
      const updates: Partial<AccessibilitySettings> = {};

      // Detect reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updates.reducedMotion = true;
      }

      // Detect high contrast preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        updates.highContrast = true;
      }

      // Detect forced colors (Windows High Contrast Mode)
      if (window.matchMedia('(forced-colors: active)').matches) {
        updates.highContrast = true;
        updates.focusIndicators = true;
      }

      if (Object.keys(updates).length > 0) {
        setSettings(prev => ({ ...prev, ...updates }));
      }
    };

    detectSystemPreferences();

    // Listen for changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    reducedMotionQuery.addEventListener('change', detectSystemPreferences);
    highContrastQuery.addEventListener('change', detectSystemPreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', detectSystemPreferences);
      highContrastQuery.removeEventListener('change', detectSystemPreferences);
    };
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Large text
    root.classList.toggle('large-text', settings.largeText);
    
    // Reduced motion
    root.classList.toggle('reduce-motion', settings.reducedMotion);
    
    // Focus indicators
    root.classList.toggle('enhanced-focus', settings.focusIndicators);
    
    // Color blind friendly
    root.classList.toggle('color-blind-friendly', settings.colorBlindFriendly);
    
    // Dark mode
    root.classList.toggle('dark-mode', settings.darkMode);
    
    // Text spacing
    root.classList.toggle('text-spacing', settings.textSpacing);
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${settings.fontSize}`);
    
    // Keyboard navigation
    root.classList.toggle('keyboard-nav', settings.keyboardNavigation);
    
    // Clickable area size
    root.classList.toggle('large-clickable', settings.clickableAreaSize);
    
    // Simplified UI
    root.classList.toggle('simplified-ui', settings.simplifiedUI);
    
    // Reading guide
    root.classList.toggle('reading-guide', settings.readingGuide);
    
    // Auto save indicator
    root.classList.toggle('auto-save', settings.autoSave);

    // Save to localStorage
    localStorage.setItem('astral-field-accessibility', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('astral-field-accessibility');
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  const setupKeyboardNavigation = () => {
    if (!settings.keyboardNavigation) return;

    // Add keyboard event listeners for enhanced navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip navigation (Alt + S)
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const mainContent = document.querySelector('main, [role="main"], #main-content');
        if (mainContent) {
          (mainContent as HTMLElement).focus();
          announceToScreenReader('Skipped to main content');
        }
      }

      // Navigation shortcuts (Alt + N)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
          const firstLink = nav.querySelector('a, button') as HTMLElement;
          firstLink?.focus();
          announceToScreenReader('Navigated to main navigation');
        }
      }

      // Search shortcut (Alt + /)
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], [role="searchbox"]') as HTMLElement;
        if (searchInput) {
          searchInput.focus();
          announceToScreenReader('Focused on search');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const getColorBlindFriendlyColor = (originalColor: string, type: 'background' | 'text' | 'accent'): string => {
    if (!settings.colorBlindFriendly) return originalColor;

    // Color blind friendly palette mapping
    const colorMappings: Record<string, Record<string, string>> = {
      // Red colors
      'red': {
        background: '#B91C1C', // Darker red for better contrast
        text: '#FEE2E2', // Light red
        accent: '#DC2626' // Medium red
      },
      'green': {
        background: '#065F46', // Dark green
        text: '#D1FAE5', // Light green
        accent: '#059669' // Medium green
      },
      'blue': {
        background: '#1E40AF', // Dark blue
        text: '#DBEAFE', // Light blue
        accent: '#2563EB' // Medium blue
      },
      'yellow': {
        background: '#92400E', // Dark amber (more contrast than yellow)
        text: '#FEF3C7', // Light amber
        accent: '#D97706' // Medium amber
      },
      'purple': {
        background: '#6B21A8', // Dark purple
        text: '#F3E8FF', // Light purple
        accent: '#9333EA' // Medium purple
      }
    };

    // Try to match original color to our mappings
    const lowerColor = originalColor.toLowerCase();
    for (const [colorName, mappings] of Object.entries(colorMappings)) {
      if (lowerColor.includes(colorName)) {
        return mappings[type] || originalColor;
      }
    }

    // If no match, return original color
    return originalColor;
  };

  // Set up keyboard navigation on mount
  useEffect(() => {
    const cleanup = setupKeyboardNavigation();
    return cleanup;
  }, [settings.keyboardNavigation]);

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      announceToScreenReader,
      setupKeyboardNavigation,
      getColorBlindFriendlyColor,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Screen Reader Only component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Skip Link component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ 
  href, 
  children 
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-md focus:shadow-lg"
  >
    {children}
  </a>
);

// Announcement component for screen readers
export const Announcement: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Focus trap component
export const FocusTrap: React.FC<{ 
  children: React.ReactNode;
  active: boolean;
}> = ({ children, active }) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const element = trapRef.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  return <div ref={trapRef}>{children}</div>;
};

export default AccessibilityProvider;