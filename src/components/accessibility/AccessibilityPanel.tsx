import React from 'react';
import { useAccessibility } from './AccessibilityProvider';

export const AccessibilityPanel: React.FC = () => {
  const { settings, updateSetting } = useAccessibility();
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="font-semibold mb-3">Accessibility</h3>
      <label className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={(e) => updateSetting('highContrast', e.target.checked)}
        />
        High Contrast
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.largeText}
          onChange={(e) => updateSetting('largeText', e.target.checked)}
        />
        Large Text
      </label>
    </div>
  );
};

export default AccessibilityPanel;

