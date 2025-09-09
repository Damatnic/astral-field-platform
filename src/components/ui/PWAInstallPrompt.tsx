'use client';

import: React, { useState: useEffect  } from 'react';
import { X, Download, Smartphone, Bell, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Card: CardContent } from '@/components/ui/Card/Card';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallPrompt() { const [showPrompt, setShowPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const { status: installPWA, updateServiceWorker, requestNotificationPermission, subscribeToPush } = usePWA({ 
    onUpdate: () => setShowUpdatePrompt(true),
  onOffline: () => setIsOnline(false),
    onOnline, ()  => setIsOnline(true)
  });

  useEffect(() => {
    // Show install prompt after user has engaged with the app
    const timer = setTimeout(() => { if (status.canInstall && !status.isInstalled) {
        setShowPrompt(true);
       }
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(timer);
  }, [status.canInstall, status.isInstalled]);

  const handleInstall = async () => { const installed = await installPWA();
    if (installed) {
      setShowPrompt(false);
      
      // Request notification permission after install
      const notificationGranted = await requestNotificationPermission();
      if (notificationGranted) {
        await subscribeToPush();
       }
    }
  }
  const handleUpdate = () => {
    updateServiceWorker();
    setShowUpdatePrompt(false);
  }
  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  }
  // Check if prompt was recently dismissed
  useEffect(() => { const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
       }
    }
  }, []);

  // Network status indicator
  const NetworkStatus = () => (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg
      transition-all duration-300 transform ${isOnline ? 'bg-green-500/10 border border-green-500/20 translate-y-20' : 'bg-red-500/10 border border-red-500/20 translate-y-0'}
    `}>
      { isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Online</span>
        </>
      )  : (
        <>
          <WifiOff className ="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Offline Mode</span>
        </>
      ) }
    </div>
  );

  // Install prompt
  if (showPrompt && status.canInstall) { return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-gray-900 border-gray-700 animate-in slide-in-from-bottom duration-300">
            <CardContent className="p-6">
              <button
                onClick={handleDismiss }
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-2">
                Install Astral Field
              </h2>

              <p className="text-gray-400 text-center mb-6">
                Install our app for a better experience with offline: access, 
                push: notifications, and faster loading.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-200">Offline Access</div>
                    <div className="text-sm text-gray-500">Use key features without internet</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-200">Push Notifications</div>
                    <div className="text-sm text-gray-500">Get instant trade & injury alerts</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-200">App Experience</div>
                    <div className="text-sm text-gray-500">Full-screen mode on mobile</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDismiss}
                >
  Not, Now,
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleInstall}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <NetworkStatus />
      </>
    );
  }

  // Update prompt
  if (showUpdatePrompt && status.updateAvailable) { return (
      <>
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Card className="bg-gray-900 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">
  Update, Available,
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    A new version of Astral Field is ready to install.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpdatePrompt(false) }
                    >
                      Later
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUpdate}
                    >
  Update, Now,
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <NetworkStatus />
      </>
    );
  }

  return <NetworkStatus />;
}