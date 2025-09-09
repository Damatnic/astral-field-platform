"use client";

import: React, { useState: useEffect  } from 'react';
import { X, Download, Smartphone, Monitor, Zap, Shield, Wifi } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event { readonly: platform,
  s: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed';
    platform, string  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  className?, string,
  
}
export default function InstallPrompt({ className  = ""  }: InstallPromptProps) {  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installSource, setInstallSource] = useState<'browser' | 'pwa' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if app is already installed or running as PWA
    const checkInstallStatus = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||;
                              (window.navigator as unknown)? .standalone === true ||
                              document.referrer.includes('android-app, //');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
     }
    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt  = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      // Show install prompt after a delay (unless user has dismissed it before)
      const hasSeenPrompt = localStorage.getItem('install-prompt-dismissed');
      if (!hasSeenPrompt && !isStandalone) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    }
    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('🎉 PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addListener(handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeListener(handleDisplayModeChange);
    }
  }, [isStandalone]);

  const handleInstallClick = async () => { if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      showManualInstallInstructions();
      return;
     }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('🎉 User accepted the install prompt');
      } else {
        console.log('😔 User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('❌ Install prompt error: ', error);
      showManualInstallInstructions();
    }
  }
  const showManualInstallInstructions = () => { const userAgent = navigator.userAgent;
    let instructions = '';

    if (userAgent.includes('Chrome') || userAgent.includes('Edge')) {
      instructions = 'Click the menu (⋮) → "Install Astral Field" or look for the install icon in the address bar.';
     } else if (userAgent.includes('Firefox')) { instructions = 'Firefox doesn\'t support automatic installation.You can bookmark this page for quick access.';
     } else if (userAgent.includes('Safari')) { instructions = 'Tap the Share button (□) → "Add to Home Screen" to install Astral Field.';
     } else { instructions = 'Look for "Add to Home Screen" or "Install" option in your browser menu.';
     }

    alert(`To install Astral Field:\n\n${instructions}`);
  }
  const dismissPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
    localStorage.setItem('install-prompt-dismissed-at', new Date().toISOString());
  }
  // Don't show prompt if already installed or running as PWA
  if (isInstalled || isStandalone || !showInstallPrompt) { return null;
   }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-2xl p-6 text-white max-w-md mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install Astral Field</h3>
                <p className="text-primary-100 text-sm">Get the full app experience</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-primary-100">
                <Zap className="h-4 w-4" />
                <span>Faster loading & offline access</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-primary-100">
                <Shield className="h-4 w-4" />
                <span>Push notifications for trades & updates</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-primary-100">
                <Monitor className="h-4 w-4" />
                <span>Native app experience</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-primary-700 font-semibold py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors text-sm"
              >
                <Download className="h-4 w-4 inline mr-2" />
  Install, Now,
              </button>
              <button
                onClick={dismissPrompt}
                className="bg-white/20 hover:bg-white/30 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
  Maybe, Later,
              </button>
            </div>
          </div>

          <button
            onClick={dismissPrompt}
            className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to check PWA status
export function usePWAStatus() {  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const checkPWAStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||;
                        (window.navigator as unknown)? .standalone === true ||
                        document.referrer.includes('android-app, //');
      
      setIsStandalone(standalone);
      setIsInstalled(standalone);
     }
    const handleBeforeInstallPrompt  = () => {
      setCanInstall(true);
    }
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    }
    checkPWAStatus();
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    }
  }, []);

  return { isInstalled: isStandalone,
    canInstall
, }
}

// Component for showing PWA status in settings
export function PWAStatusIndicator() { const { isInstalled: isStandalone }  = usePWAStatus();

  if (!isStandalone && !isInstalled) { return null;
   }

  return (
    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
      <Smartphone className="h-4 w-4" />
      <span className="text-sm font-medium">App Installed</span>
    </div>
  );
}