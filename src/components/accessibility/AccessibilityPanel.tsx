import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { cn } from '@/lib/utils';

interface AccessibilityPanelProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SettingToggle: React.FC<{
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}> = ({ id, label, description, checked, onChange, icon }) => {
  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors">
      {icon && (
        <div className="flex-shrink-0 mt-1 text-blue-400">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="flex items-start justify-between cursor-pointer">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-200">{label}</h3>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              role="switch"
              aria-checked={checked}
              aria-describedby={`${id}-description`}
              onClick={() => onChange(!checked)}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                checked ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <span className="sr-only">Toggle {label}</span>
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  checked ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </label>
        <div id={`${id}-description`} className="sr-only">
          {description}
        </div>
      </div>
    </div>
  );
};

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  className,
  isOpen,
  onClose
}) => {
  const { settings, updateSetting, resetSettings, announceToScreenReader } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'visual' | 'motor' | 'cognitive' | 'audio'>('visual');

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    announceToScreenReader(
      `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`,
      'polite'
    );
  };

  const handleReset = () => {
    resetSettings();
    announceToScreenReader('Accessibility settings reset to defaults', 'polite');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'visual', label: 'Visual', icon: '👁️' },
    { id: 'motor', label: 'Motor', icon: '✋' },
    { id: 'cognitive', label: 'Cognitive', icon: '🧠' },
    { id: 'audio', label: 'Audio', icon: '🔊' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-white">Accessibility Settings</h2>
              <p className="text-sm text-gray-400 mt-1">Customize your experience</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close accessibility panel"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                )}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
              >
                <span className="block mb-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Visual Tab */}
            {activeTab === 'visual' && (
              <div role="tabpanel" id="visual-panel" aria-labelledby="visual-tab" className="p-2">
                <SettingToggle
                  id="high-contrast"
                  label="High Contrast"
                  description="Increase contrast for better visibility"
                  checked={settings.highContrast}
                  onChange={(value) => handleSettingChange('highContrast', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                />
                
                <SettingToggle
                  id="large-text"
                  label="Large Text"
                  description="Increase text size for better readability"
                  checked={settings.largeText}
                  onChange={(value) => handleSettingChange('largeText', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                />
                
                <SettingToggle
                  id="reduced-motion"
                  label="Reduced Motion"
                  description="Minimize animations and transitions"
                  checked={settings.reducedMotion}
                  onChange={(value) => handleSettingChange('reducedMotion', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                
                <SettingToggle
                  id="focus-indicators"
                  label="Enhanced Focus Indicators"
                  description="Show clearer focus outlines for keyboard navigation"
                  checked={settings.focusIndicators}
                  onChange={(value) => handleSettingChange('focusIndicators', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
                />

                <SettingToggle
                  id="reading-guide"
                  label="Reading Guide"
                  description="Highlight current line while reading"
                  checked={settings.readingGuide}
                  onChange={(value) => handleSettingChange('readingGuide', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
              </div>
            )}

            {/* Motor Tab */}
            {activeTab === 'motor' && (
              <div role="tabpanel" id="motor-panel" aria-labelledby="motor-tab" className="p-2">
                <SettingToggle
                  id="sticky-keys"
                  label="Sticky Keys"
                  description="Use modifier keys without holding them down"
                  checked={settings.stickyKeys}
                  onChange={(value) => handleSettingChange('stickyKeys', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                />
                
                <SettingToggle
                  id="slow-keys"
                  label="Slow Keys"
                  description="Add delay before key press registration"
                  checked={settings.slowKeys}
                  onChange={(value) => handleSettingChange('slowKeys', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                
                <SettingToggle
                  id="bounce-keys"
                  label="Bounce Keys"
                  description="Ignore repeated key presses"
                  checked={settings.bounceKeys}
                  onChange={(value) => handleSettingChange('bounceKeys', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                />
              </div>
            )}

            {/* Cognitive Tab */}
            {activeTab === 'cognitive' && (
              <div role="tabpanel" id="cognitive-panel" aria-labelledby="cognitive-tab" className="p-2">
                <SettingToggle
                  id="simplified-ui"
                  label="Simplified Interface"
                  description="Hide non-essential interface elements"
                  checked={settings.simplifiedUI}
                  onChange={(value) => handleSettingChange('simplifiedUI', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
                />
                
                <SettingToggle
                  id="extended-timeouts"
                  label="Extended Timeouts"
                  description="Give more time for timed actions"
                  checked={settings.extendedTimeouts}
                  onChange={(value) => handleSettingChange('extendedTimeouts', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
              </div>
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              <div role="tabpanel" id="audio-panel" aria-labelledby="audio-tab" className="p-2">
                <SettingToggle
                  id="announcements"
                  label="Screen Reader Announcements"
                  description="Enable audio feedback for actions"
                  checked={settings.announcements}
                  onChange={(value) => handleSettingChange('announcements', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                />
                
                <SettingToggle
                  id="verbose-descriptions"
                  label="Verbose Descriptions"
                  description="Provide detailed descriptions for screen readers"
                  checked={settings.verboseDescriptions}
                  onChange={(value) => handleSettingChange('verboseDescriptions', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />

                <SettingToggle
                  id="skip-links"
                  label="Skip Links"
                  description="Show navigation skip links"
                  checked={settings.skipLinks}
                  onChange={(value) => handleSettingChange('skipLinks', value)}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 p-4 space-y-3">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset to Defaults
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Settings are saved automatically and persist across sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;