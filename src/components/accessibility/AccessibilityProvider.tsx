import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  // Visual accessibility
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
  
  // Motor accessibility
  stickyKeys: boolean;
  slowKeys: boolean;
  bounceKeys: boolean;
  
  // Cognitive accessibility
  simplifiedUI: boolean;
  extendedTimeouts: boolean;
  readingGuide: boolean;
  
  // Screen reader
  announcements: boolean;
  verboseDescriptions: boolean;
  skipLinks: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  focusIndicators: true,
  stickyKeys: false,
  slowKeys: false,
  bounceKeys: false,
  simplifiedUI: false,
  extendedTimeouts: false,
  readingGuide: false,
  announcements: true,
  verboseDescriptions: false,
  skipLinks: true,
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
    
    // Simplified UI
    root.classList.toggle('simplified-ui', settings.simplifiedUI);
    
    // Reading guide
    root.classList.toggle('reading-guide', settings.readingGuide);

    // Save to localStorage
    localStorage.setItem('astral-field-accessibility', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
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
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      announceToScreenReader,
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