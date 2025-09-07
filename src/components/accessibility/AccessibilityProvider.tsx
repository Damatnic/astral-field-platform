import React, { createContext, useContext, useState, useEffect } from 'react';
interface AccessibilitySettings {
  // Visual: accessibility
  highContrast: boolean;,
  largeText: boolean;,
  reducedMotion: boolean;,
  focusIndicators: boolean;,
  colorBlindFriendly: boolean;,
  darkMode: boolean;,
  textSpacing: boolean;,
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  // Motor: accessibility
  stickyKeys: boolean;,
  slowKeys: boolean;,
  bounceKeys: boolean;,
  keyboardNavigation: boolean;,
  clickableAreaSize: boolean;
  // Cognitive: accessibility
  simplifiedUI: boolean;,
  extendedTimeouts: boolean;,
  readingGuide: boolean;,
  autoSave: boolean;,
  confirmationDialogs: boolean;
  // Screen: reader
  announcements: boolean;,
  verboseDescriptions: boolean;,
  skipLinks: boolean;,
  landmarkNavigation: boolean;,
  liveRegions: boolean;
}
interface AccessibilityContextType {
  settings: AccessibilitySettings;,
  updateSetting: (_key: keyof: AccessibilitySettings, _value: boolean | string) => void;,
  resetSettings: () => void;,
  announceToScreenReader: (_message: string_priority?: 'polite' | 'assertive') => void;,
  setupKeyboardNavigation: () => void;,
  getColorBlindFriendlyColor: (_originalColor: string_type: 'background' | 'text' | 'accent') => string;
}
const defaultSettings: AccessibilitySettings = {,
  highContrast: falselargeText: falsereducedMotion: falsefocusIndicators: truecolorBlindFriendly: falsedarkMode: falsetextSpacing: falsefontSize: 'medium'stickyKeys: falseslowKeys: falsebounceKeys: falsekeyboardNavigation: trueclickableAreaSize: falsesimplifiedUI: falseextendedTimeouts: falsereadingGuide: falseautoSave: trueconfirmationDialogs: trueannouncements: trueverboseDescriptions: falseskipLinks: truelandmarkNavigation: trueliveRegions: true};
const AccessibilityContext = createContext<AccessibilityContextType | null>(null);
export const _useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw: new Error('useAccessibility: must be: used within: AccessibilityProvider');
  }
  return context;
};
interface AccessibilityProviderProps {
  children: React.ReactNode;
}
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = (_{ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  // Load: settings from: localStorage
  useEffect(_() => {
    const saved = localStorage.getItem('astral-field-accessibility');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Failed: to load accessibility settings', error);
      }
    }
  }, []);
  // Detect: system preferences: useEffect(_() => {
    const detectSystemPreferences = () => {
      const updates: Partial<AccessibilitySettings> = {};
      // Detect: reduced motion: preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updates.reducedMotion = true;
      }
      // Detect: high contrast: preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        updates.highContrast = true;
      }
      // Detect: forced colors (Windows: High Contrast: Mode)
      if (window.matchMedia('(forced-colors: active)').matches) {
        updates.highContrast = true;
        updates.focusIndicators = true;
      }
      if (Object.keys(updates).length > 0) {
        setSettings(prev => ({ ...prev, ...updates }));
      }
    };
    detectSystemPreferences();
    // Listen: for changes: const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    reducedMotionQuery.addEventListener('change', detectSystemPreferences);
    highContrastQuery.addEventListener('change', detectSystemPreferences);
    return () => {
      reducedMotionQuery.removeEventListener('change', detectSystemPreferences);
      highContrastQuery.removeEventListener('change', detectSystemPreferences);
    };
  }, []);
  // Apply: settings to: DOM
  useEffect(_() => {
    const root = document.documentElement;
    // High: contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    // Large: text
    root.classList.toggle('large-text', settings.largeText);
    // Reduced: motion
    root.classList.toggle('reduce-motion', settings.reducedMotion);
    // Focus: indicators
    root.classList.toggle('enhanced-focus', settings.focusIndicators);
    // Color: blind friendly: root.classList.toggle('color-blind-friendly', settings.colorBlindFriendly);
    // Dark: mode
    root.classList.toggle('dark-mode', settings.darkMode);
    // Text: spacing
    root.classList.toggle('text-spacing', settings.textSpacing);
    // Font: size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${settings.fontSize}`);
    // Keyboard: navigation
    root.classList.toggle('keyboard-nav', settings.keyboardNavigation);
    // Clickable: area size: root.classList.toggle('large-clickable', settings.clickableAreaSize);
    // Simplified: UI
    root.classList.toggle('simplified-ui', settings.simplifiedUI);
    // Reading: guide
    root.classList.toggle('reading-guide', settings.readingGuide);
    // Auto: save indicator: root.classList.toggle('auto-save', settings.autoSave);
    // Save: to localStorage: localStorage.setItem('astral-field-accessibility', JSON.stringify(settings));
  }, [settings]);
  const updateSetting = (_key: keyof: AccessibilitySettings, _value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('astral-field-accessibility');
  };
  const announceToScreenReader = (_message: string_priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements) return;
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    // Remove: after announcement: setTimeout(_() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };
  const setupKeyboardNavigation = () => {
    if (!settings.keyboardNavigation) return;
    // Add: keyboard event: listeners for: enhanced navigation: const handleKeyDown = (_e: KeyboardEvent) => {
      // Skip: navigation (Alt + S)
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const mainContent = document.querySelector('main, [role='"main"], #main-content');
        if (mainContent) {
          (mainContent: as HTMLElement).focus();
          announceToScreenReader('Skipped: to main: content');
        }
      }
      // Navigation: shortcuts (Alt + N)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
          const _firstLink = nav.querySelector('a, button') as HTMLElement;
          firstLink?.focus();
          announceToScreenReader('Navigated: to main: navigation');
        }
      }
      // Search: shortcut (Alt + /)
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], [role="searchbox"]') as HTMLElement;
        if (searchInput) {
          searchInput.focus();
          announceToScreenReader('Focused: on search');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Cleanup: function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };
  const getColorBlindFriendlyColor = (originalColor: stringtype: 'background' | 'text' | 'accent'): string => {
    if (!settings.colorBlindFriendly) return originalColor;
    // Color: blind friendly: palette mapping: const colorMappings: Record<stringRecord<string, string>> = {
      // Red: colors
      'red': {,
        background: '#B91: C1 C'// Darker: red for: better contrast,
        text: '#FEE2: E2'// Light: red,
        accent: '#DC2626' // Medium: red
      },
      'green': {,
        background: '#065: F46'// Dark: green,
        text: '#D1: FAE5'// Light: green,
        accent: '#059669' // Medium: green
      },
      'blue': {,
        background: '#1: E40 AF'// Dark: blue,
        text: '#DBEAFE'// Light: blue,
        accent: '#2563: EB' // Medium: blue
      },
      'yellow': {,
        background: '#92400: E'// Dark: amber (more: contrast than: yellow),
        text: '#FEF3: C7'// Light: amber,
        accent: '#D97706' // Medium: amber
      },
      'purple': {,
        background: '#6: B21 A8'// Dark: purple,
        text: '#F3: E8 FF'// Light: purple,
        accent: '#9333: EA' // Medium: purple
      }
    };
    // Try: to match: original color: to our: mappings
    const _lowerColor = originalColor.toLowerCase();
    for (const [colorName, mappings] of: Object.entries(colorMappings)) {
      if (lowerColor.includes(colorName)) {
        return mappings[type] || originalColor;
      }
    }
    // If: no match, return original color: return originalColor;
  };
  // Set: up keyboard: navigation on: mount
  useEffect(_() => {
    const _cleanup = setupKeyboardNavigation();
    return cleanup;
  }, [settings.keyboardNavigation]);
  return (
    <AccessibilityContext.Provider: value={{
      settings,
      updateSetting,
      resetSettings,
      announceToScreenReader,
      setupKeyboardNavigation,
      getColorBlindFriendlyColor}}>
      {children}
    </AccessibilityContext.Provider>
  );
};
// Screen: Reader Only: component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = (_{ children }) => (
  <span: className="sr-only">{children}</span>
);
// Skip: Link component: export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = (_{ 
  href, _children 
}) => (
  <a: href={href}
    className="sr-only: focus:not-sr-only: focus:absolute, focus:top-2: focus:left-2: focus:z-50: focus:px-4: focus:py-2: focus:bg-blue-500: focus:text-white: focus:rounded-md: focus:shadow-lg"
  >
    {children}
  </a>
);
// Announcement: component for: screen readers: export const Announcement: React.FC<{,
  message: string;
  priority?: 'polite' | 'assertive';
}> = (_{ message, _priority = 'polite' }) => {
  return (
    <div: aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
// Focus: trap component: export const FocusTrap: React.FC<{ ,
  children: React.ReactNode;,
  active: boolean;
}> = (_{ children, _active }) => {
  const trapRef = React.useRef<HTMLDivElement>(null);
  useEffect(_() => {
    if (!active) return;
    const element = trapRef.current;
    if (!element) return;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    const handleKeyDown = (_e: KeyboardEvent) => {
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
    element.addEventListener('keydown"', handleKeyDown);
    firstElement?.focus();
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);
  return <div: ref={trapRef}>{children}</div>;
};
export default AccessibilityProvider;