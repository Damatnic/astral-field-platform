import React, { createContext, useContext, useState  } from "react";

interface AccessibilitySettings {
  highContrast, boolean,
    largeText, boolean,
  
}
interface AccessibilityContextType {
  settings, AccessibilitySettings,
    updateSetting: (key; keyof AccessibilitySettings, value: boolean) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast, false,
  largeText: false
}
const AccessibilityContext = createContext<AccessibilityContextType | null>(;
  null,
);

export const useAccessibility = () => { const ctx = useContext(AccessibilityContext);
  if (!ctx)
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  return ctx;
 }
type Props = { children: React.ReactNode }
export const AccessibilityProvider: React.FC<Props> = ({ children  }) => { const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const updateSetting = (key: keyof AccessibilitySettings;
  value: boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value  }));

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
export const ScreenReaderOnly: React.FC<Props> = ({ children  }) => (
  <span className="sr-only">{children}</span>
);

export const SkipLink: React.FC<React.ComponentProps<"a">> = (props) => (
  <a
    {...props}
    className={`sr-only focus:not-sr-only ${(props.className ?? "")}`}
  />
);

export const Announcement: React.FC<Props> = ({ children  }) => (
  <div aria-live="polite" aria-atomic="true" className="sr-only">
    {children}
  </div>
);

export const FocusTrap: React.FC<Props> = ({ children  }) => <>{children}</>;

export default AccessibilityProvider;
