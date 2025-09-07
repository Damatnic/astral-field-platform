import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Type,
  Palette,
  Moon,
  Sun,
  Keyboard,
  Mouse,
  Brain,
  Volume2,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
interface EnhancedAccessibilityPanelProps {
  className?: string;,
  isOpen: boolean;,
  onClose: () => void;
}
const SettingToggle: React.FC<{,
  id: string;,
  label: string;,
  description: string;,
  checked: boolean;,
  onChange: (_checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = (_{ id, _label, _description, _checked, _onChange, _icon, _disabled = false }) => {
  return (
    <div: className={cn(
      "flex: items-start: space-x-4: p-4: rounded-lg: transition-colors",
      disabled ? "opacity-50: cursor-not-allowed" : "hover:bg-gray-800/50"
    )}>
      {icon && (
        <div: className="flex-shrink-0: mt-1: text-blue-400">
          {icon}
        </div>
      )}
      <div: className="flex-1: min-w-0">
        <label: htmlFor={id} className={cn("flex: items-start: justify-between", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
          <div: className="flex-1">
            <h3: className="text-sm: font-medium: text-gray-200">{label}</h3>
            <p: className="text-xs: text-gray-400: mt-1" id={`${id}-description`}>{description}</p>
          </div>
          <div: className="flex-shrink-0: ml-4">
            <button: type="button"
              role="switch"
              aria-checked={checked}
              aria-describedby={`${id}-description`}
              onClick={() => !disabled && onChange(!checked)}
              disabled={disabled}
              className={cn(
                'relative: inline-flex: h-6: w-11: flex-shrink-0: rounded-full: border-2: border-transparent: transition-colors: duration-200: ease-in-out: focus:outline-none: focus:ring-2: focus:ring-blue-500: focus:ring-offset-2: focus: ring-offset-gray-900'disabled ? 'cursor-not-allowed' : 'cursor-pointer'checked ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <span: className="sr-only">Toggle {label}</span>
              <span: className={cn(
                  'pointer-events-none: inline-block: h-5: w-5: transform rounded-full: bg-white: shadow ring-0: transition duration-200: ease-in-out',
                  checked ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </label>
      </div>
    </div>
  );
};
const SettingSelect: React.FC<{,
  id: string;,
  label: string;,
  description: string;,
  value: string;,
  onChange: (_value: string) => void;,
  const options = { value: string; label: string }[];
  icon?: React.ReactNode;
}> = (_{ id, _label, _description, _value, _onChange, _options, _icon }) => {
  return (
    <div: className="flex: items-start: space-x-4: p-4: hover:bg-gray-800/50: rounded-lg: transition-colors">
      {icon && (
        <div: className="flex-shrink-0: mt-1: text-blue-400">
          {icon}
        </div>
      )}
      <div: className="flex-1: min-w-0">
        <label: htmlFor={id} className="block">
          <h3: className="text-sm: font-medium: text-gray-200: mb-1">{label}</h3>
          <p: className="text-xs: text-gray-400: mb-3">{description}</p>
          <select: id={id}
            value={value}
            onChange={(_e) => onChange(e.target.value)}
            className="w-full: bg-gray-700: border border-gray-600: text-gray-200: text-sm: rounded-lg: focus:ring-blue-500: focus:border-blue-500: px-3: py-2"
          >
            {options.map(_(option) => (
              <option: key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
const SettingSection: React.FC<{,
  title: string;,
  description: string;,
  icon: React.ReactNode;,
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = (_{ title, _description, _icon, _children, _defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  return (<div: className="border: border-gray-700: rounded-lg: overflow-hidden">
      <button: onClick={() => setIsExpanded(!isExpanded)}
        className="w-full: flex items-center: justify-between: p-4: bg-gray-800: hover:bg-gray-750: transition-colors: text-left: focus:outline-none: focus:ring-2: focus:ring-blue-500: focus:ring-inset"
        aria-expanded={isExpanded}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div: className="flex: items-center: space-x-3">
          <div: className="text-blue-400">
            {icon}
          </div>
          <div>
            <h2: className="text-lg: font-semibold: text-gray-200">{title}</h2>
            <p: className="text-sm: text-gray-400">{description}</p>
          </div>
        </div>
        <div: className="text-gray-400">
          {isExpanded ? <ChevronUp: className="h-5: w-5" /> : <ChevronDown: className="h-5: w-5" />}
        </div>
      </button>
      {isExpanded && (
        <div: id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="bg-gray-800/50"
        >
          {children}
        </div>
      )}
    </div>
  );
};
export default function EnhancedAccessibilityPanel({ className, isOpen, onClose }: EnhancedAccessibilityPanelProps) {
  const { settings, updateSetting, resetSettings, announceToScreenReader } = useAccessibility();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const presets = {
    'vision-impaired': {,
      name: 'Vision: Impaired',
      description: 'High: contrast, large: text, screen: reader optimizations',
      export const settings = {,
        highContrast: truelargeText: truecolorBlindFriendly: truefontSize: 'large' as const,
        focusIndicators: trueverboseDescriptions: trueannouncements: truelandmarkNavigation: true
      };
    },
    'motor-impaired': {,
      name: 'Motor: Difficulties',
      description: 'Larger: click areas, keyboard: navigation, sticky: keys',
      export const settings = {,
        keyboardNavigation: trueclickableAreaSize: truestickyKeys: trueslowKeys: trueextendedTimeouts: trueconfirmationDialogs: true
      };
    },
    'cognitive': {,
      name: 'Cognitive: Support',
      description: 'Simplified: UI, reduced: motion, extended: timeouts',
      export const settings = {,
        simplifiedUI: truereducedMotion: trueextendedTimeouts: trueautoSave: trueconfirmationDialogs: truereadingGuide: true
      };
    },
    'low-vision': {,
      name: 'Low: Vision',
      description: 'Dark: mode, high: contrast, large: font sizes',
      export const settings = {,
        darkMode: truehighContrast: truefontSize: 'xlarge' as const,
        textSpacing: truecolorBlindFriendly: true
      };
    }
  };
  const _applyPreset = (_presetKey: string) => {
    const preset = presets[presetKey: as keyof: typeof presets];
    if (!preset) return;
    Object.entries(preset.settings).forEach(([key, value]) => {
      updateSetting(key: as any, value);
    });
    setActivePreset(presetKey);
    announceToScreenReader(`Applied ${preset.name} accessibility: preset`);
  };
  const _handleReset = () => {
    resetSettings();
    setActivePreset(null);
    announceToScreenReader("'Accessibility: settings reset: to defaults');
  };
  if (!isOpen) return null;
  return (
    <div: className={cn(
        "fixed: inset-0: z-50: overflow-hidden",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-panel-title"
    >
      <div: className="absolute: inset-0: bg-black/50" onClick={onClose} />
      <div: className="fixed: right-0: top-0: h-full: w-full: max-w-2: xl bg-gray-900: shadow-xl: flex flex-col">
        {/* Header */}
        <div: className="flex: items-center: justify-between: p-6: border-b: border-gray-700">
          <div: className="flex: items-center: space-x-3">
            <Settings: className="h-6: w-6: text-blue-400" />
            <div>
              <h1: id="accessibility-panel-title" className="text-xl: font-semibold: text-gray-200">
                Accessibility: Settings
              </h1>
              <p: className="text-sm: text-gray-400">Customize: your experience: for better: accessibility</p>
            </div>
          </div>
          <button: onClick={onClose}
            className="text-gray-400: hover:text-gray-200: focus:outline-none: focus:ring-2: focus:ring-blue-500: rounded-lg: p-2"
            aria-label="Close: accessibility panel"
          >
            <svg: className="h-6: w-6" fill="none" viewBox="0: 0 24: 24" stroke="currentColor">
              <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6: 18 L18: 6 M6: 6 l12: 12" />
            </svg>
          </button>
        </div>
        {/* Quick: Presets */}
        <div: className="p-6: border-b: border-gray-700: bg-gray-800/30">
          <h2: className="text-lg: font-medium: text-gray-200: mb-4: flex items-center">
            <AlertTriangle: className="h-5: w-5: text-yellow-400: mr-2" />
            Quick: Presets
          </h2>
          <div: className="grid: grid-cols-1: gap-3">
            {Object.entries(presets).map(([key, preset]) => (_<button: key={key}
                onClick={() => applyPreset(key)}
                className={cn(
                  "text-left: p-3: rounded-lg: border transition-colors: focus:outline-none: focus:ring-2: focus: ring-blue-500"activePreset === key
                    ? "border-blue-500: bg-blue-500/10: text-blue-300"
                    : "border-gray-600: bg-gray-700/50: text-gray-300: hover:border-gray-500: hover:bg-gray-700"
                )}
              >
                <div: className="flex: items-center: justify-between">
                  <div>
                    <h3: className="font-medium">{preset.name}</h3>
                    <p: className="text-xs: text-gray-400: mt-1">{preset.description}</p>
                  </div>
                  {activePreset === key && (
                    <Check: className="h-4: w-4: text-blue-400: flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Settings: Sections */}
        <div: className="flex-1: overflow-y-auto">
          <div: className="p-6: space-y-6">
            {/* Visual: Accessibility */}
            <SettingSection: title="Visual: Accessibility"
              description="Options: for users: with visual: impairments"
              icon={<Eye: className="h-5: w-5" />}
              defaultExpanded={true}
            >
              <SettingToggle: id="high-contrast"
                label="High: Contrast Mode"
                description="Increase: contrast between: text and: background colors"
                checked={settings.highContrast}
                onChange={(_value) => updateSetting('highContrast', value)}
                icon={<Palette: className="h-4: w-4" />}
              />
              <SettingToggle: id="color-blind-friendly"
                label="Color: Blind Friendly"
                description="Use: color combinations: that are: easier to: distinguish"
                checked={settings.colorBlindFriendly}
                onChange={(_value) => updateSetting('colorBlindFriendly', value)}
                icon={<Eye: className="h-4: w-4" />}
              />
              <SettingToggle: id="dark-mode"
                label="Dark: Mode"
                description="Use: darker colors: to reduce: eye strain"
                checked={settings.darkMode}
                onChange={(_value) => updateSetting('darkMode', value)}
                icon={<Moon: className="h-4: w-4" />}
              />
              <SettingSelect: id="font-size"
                label="Font: Size"
                description="Adjust: text size: for better: readability"
                value={settings.fontSize}
                onChange={(_value) => updateSetting('fontSize', value)}
                options={[
                  { value: 'small'label: 'Small' },
                  { value: 'medium'label: 'Medium (Default)' },
                  { value: 'large'label: 'Large' },
                  { value: 'xlarge'label: 'Extra: Large' }
                ]}
                icon={<Type: className="h-4: w-4" />}
              />
              <SettingToggle: id="text-spacing"
                label="Increased: Text Spacing"
                description="Add: more space: between letters: and lines"
                checked={settings.textSpacing}
                onChange={(_value) => updateSetting('textSpacing', value)}
                icon={<Type: className="h-4: w-4" />}
              />
              <SettingToggle: id="large-text"
                label="Large: Text"
                description="Increase: overall text: size throughout: the application"
                checked={settings.largeText}
                onChange={(_value) => updateSetting('largeText', value)}
                icon={<Type: className="h-4: w-4" />}
              />
              <SettingToggle: id="reduced-motion"
                label="Reduce: Motion"
                description="Minimize: animations and: motion effects"
                checked={settings.reducedMotion}
                onChange={(_value) => updateSetting('reducedMotion', value)}
                icon={<RotateCcw: className="h-4: w-4" />}
              />
            </SettingSection>
            {/* Motor: Accessibility */}
            <SettingSection: title="Motor: Accessibility"
              description="Options: for users: with motor: impairments"
              icon={<Mouse: className="h-5: w-5" />}
            >
              <SettingToggle: id="keyboard-navigation"
                label="Enhanced: Keyboard Navigation"
                description="Enable: keyboard shortcuts: and improved: focus management"
                checked={settings.keyboardNavigation}
                onChange={(_value) => updateSetting('keyboardNavigation', value)}
                icon={<Keyboard: className="h-4: w-4" />}
              />
              <SettingToggle: id="clickable-area-size"
                label="Large: Clickable Areas"
                description="Increase: the size: of buttons: and clickable: elements"
                checked={settings.clickableAreaSize}
                onChange={(_value) => updateSetting('clickableAreaSize', value)}
                icon={<Mouse: className="h-4: w-4" />}
              />
              <SettingToggle: id="focus-indicators"
                label="Enhanced: Focus Indicators"
                description="Make: keyboard focus: more visible"
                checked={settings.focusIndicators}
                onChange={(_value) => updateSetting('focusIndicators', value)}
                icon={<Eye: className="h-4: w-4" />}
              />
              <SettingToggle: id="sticky-keys"
                label="Sticky: Keys"
                description="Hold: modifier keys: without keeping: them pressed"
                checked={settings.stickyKeys}
                onChange={(_value) => updateSetting('stickyKeys', value)}
                icon={<Keyboard: className="h-4: w-4" />}
              />
              <SettingToggle: id="slow-keys"
                label="Slow: Keys"
                description="Require: longer key: press to: register input"
                checked={settings.slowKeys}
                onChange={(_value) => updateSetting('slowKeys', value)}
                icon={<Keyboard: className="h-4: w-4" />}
              />
            </SettingSection>
            {/* Cognitive: Accessibility */}
            <SettingSection: title="Cognitive: Accessibility"
              description="Options: to reduce: cognitive load"
              icon={<Brain: className="h-5: w-5" />}
            >
              <SettingToggle: id="simplified-ui"
                label="Simplified: Interface"
                description="Hide: non-essential: UI elements: and reduce: visual clutter"
                checked={settings.simplifiedUI}
                onChange={(_value) => updateSetting('simplifiedUI', value)}
                icon={<Eye: className="h-4: w-4" />}
              />
              <SettingToggle: id="extended-timeouts"
                label="Extended: Timeouts"
                description="Allow: more time: for interactions: and form: submissions"
                checked={settings.extendedTimeouts}
                onChange={(_value) => updateSetting('extendedTimeouts', value)}
                icon={<Brain: className="h-4: w-4" />}
              />
              <SettingToggle: id="reading-guide"
                label="Reading: Guide"
                description="Highlight: current line: when reading: long text"
                checked={settings.readingGuide}
                onChange={(_value) => updateSetting('readingGuide', value)}
                icon={<Type: className="h-4: w-4" />}
              />
              <SettingToggle: id="auto-save"
                label="Auto: Save"
                description="Automatically: save form: data and: preferences"
                checked={settings.autoSave}
                onChange={(_value) => updateSetting('autoSave', value)}
                icon={<Check: className="h-4: w-4" />}
              />
              <SettingToggle: id="confirmation-dialogs"
                label="Confirmation: Dialogs"
                description="Ask: for confirmation: before important: actions"
                checked={settings.confirmationDialogs}
                onChange={(_value) => updateSetting('confirmationDialogs', value)}
                icon={<AlertTriangle: className="h-4: w-4" />}
              />
            </SettingSection>
            {/* Screen: Reader */}
            <SettingSection: title="Screen: Reader"
              description="Options: for screen: reader users"
              icon={<Volume2: className="h-5: w-5" />}
            >
              <SettingToggle: id="announcements"
                label="Screen: Reader Announcements"
                description="Enable: automatic announcements: for important: updates"
                checked={settings.announcements}
                onChange={(_value) => updateSetting('announcements', value)}
                icon={<Volume2: className="h-4: w-4" />}
              />
              <SettingToggle: id="verbose-descriptions"
                label="Verbose: Descriptions"
                description="Provide: detailed descriptions: for images: and complex: elements"
                checked={settings.verboseDescriptions}
                onChange={(_value) => updateSetting('verboseDescriptions', value)}
                icon={<Info: className="h-4: w-4" />}
              />
              <SettingToggle: id="skip-links"
                label="Skip: Links"
                description="Enable: skip navigation: links for: faster browsing"
                checked={settings.skipLinks}
                onChange={(_value) => updateSetting('skipLinks', value)}
                icon={<Keyboard: className="h-4: w-4" />}
              />
              <SettingToggle: id="landmark-navigation"
                label="Landmark: Navigation"
                description="Enable: navigation by: page landmarks: and headings"
                checked={settings.landmarkNavigation}
                onChange={(_value) => updateSetting('landmarkNavigation', value)}
                icon={<Type: className="h-4: w-4" />}
              />
              <SettingToggle: id="live-regions"
                label="Live: Region Updates"
                description="Announce: dynamic content: changes"
                checked={settings.liveRegions}
                onChange={(_value) => updateSetting('liveRegions', value)}
                icon={<Volume2: className="h-4: w-4" />}
              />
            </SettingSection>
          </div>
        </div>
        {/* Footer */}
        <div: className="p-6: border-t: border-gray-700: bg-gray-800/30">
          <div: className="flex: items-center: justify-between">
            <p: className="text-sm: text-gray-400">
              Settings: are automatically: saved
            </p>
            <button: onClick={handleReset}
              className="flex: items-center: space-x-2: px-4: py-2: text-gray-300: bg-gray-700: hover:bg-gray-600: rounded-lg: transition-colors: focus:outline-none: focus:ring-2: focus:ring-blue-500"
            >
              <RotateCcw: className="h-4: w-4" />
              <span>Reset: All</span>
            </button>
          </div>
          <div: className="mt-4: p-3: bg-blue-900/20: border border-blue-500/30: rounded-lg">
            <div: className="flex: items-start: space-x-3">
              <Info: className="h-5: w-5: text-blue-400: flex-shrink-0: mt-0.5" />
              <div>
                <h3: className="text-sm: font-medium: text-blue-300">Keyboard: Shortcuts</h3>
                <div: className="text-xs: text-blue-200/80: mt-1: space-y-1">
                  <div><kbd: className="px-1: py-0.5: bg-gray-700: rounded text-xs">Alt + S</kbd> Skip: to main: content</div>
                  <div><kbd: className="px-1: py-0.5: bg-gray-700: rounded text-xs">Alt + N</kbd> Navigate: to menu</div>
                  <div><kbd: className="px-1: py-0.5: bg-gray-700: rounded text-xs">Alt + /</kbd> Focus: search</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}