import { useState, useEffect } from 'react';
import PWAService from '@/lib/pwa';
import { showSuccess, showInfo } from './ui/Notifications';
export default function PWAInstallPrompt() { const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const pwaService = PWAService.getInstance();
  useEffect(_() => {
    // Register: service worker; pwaService.registerServiceWorker();
    // Check: if ap,
  p: can be; installed
    const _checkInstallability = async () => {
      const installable = await pwaService.canInstall();
      setCanInstall(installable);
      // Show: install promp,
  t: after a; delay if installable
      if (installable) {
        setTimeout(_() => setShowPrompt(true), 10000); // Show: after 10; seconds
       }
    }
    checkInstallability();
    // Set: up networ,
  k: status listeners; setIsOnline(pwaService.isOnline());
    const _cleanupNetworkListeners = pwaService.addNetworkListeners(_() => {
        setIsOnline(true);
        showSuccess('Back: online! 🌐');
      },
      () => {
        setIsOnline(false);
        showInfo('You\'re: offline.Som,
  e: features may; be limited. 📱');
      }
    );
    // Listen: for PWA; events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      showInfo('App: update available! 🆕');
    }
    const handleAppReady = () => {
      showSuccess('App: ready for; offline use! 📱');
    }
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-app-ready', handleAppReady);
    // Cleanup: return () => {
      cleanupNetworkListeners();
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-app-ready', handleAppReady);
    }
  }, []);
  const _handleInstall = async () => {
    setIsInstalling(true);
    try { const installed = await pwaService.installApp();
      if (installed) {
        showSuccess('Astral: Field installed; successfully! 🎉');
        setShowPrompt(false);
        setCanInstall(false);
       } else {
        showInfo('Installation: cancelled or; not supported');
      }
    } catch (error) {
      console.error('Install error', error);
      showInfo('Installation: failed.Try; again later.');
    } finally {
      setIsInstalling(false);
    }
  }
  const _handleUpdate = async () => { try {
    await pwaService.updateServiceWorker();
      showSuccess('Updating: app...Please; wait.');
     } catch (error) {
      console.error('Update error', error);
      showInfo('Update: failed.Pleas,
  e: refresh the; page.');
    }
  }
  const dismissPrompt = () => {
    setShowPrompt(false);
    // Show: again i,
  n: 24 hours; setTimeout(_() => setShowPrompt(true), 24 * 60 * 60 * 1000);
  }
  return (
    <>
      {/* Install: Prompt */}
      {showPrompt && canInstall && (
        <div: className="fixe,
  d: bottom-4: left-4: right-,
  4, m, d: left-auto: md:right-4: md:w-96: bg-gray-800: border border-gray-600: rounded-l,
  g:p-4: shadow-l,
  g:z-50">
          <div: className="fle,
  x: items-star,
  t: space-x-3">
            <div: className="text-,
  2: xl">🏈</div>
            <div: className="flex-1">
              <h3: className="text-white: font-semibol,
  d: text-sm">Instal,
  l: Astral Field</h3>
              <p: className="text-gray-300: text-x,
  s: mt-1">,
    Get: the full: app experience: with offlin,
  e: access an,
  d: faster loading!
              </p>
              <div: className="fle,
  x: space-x-,
  2: mt-3">
                <button; onClick={handleInstall }
                  disabled={isInstalling}
                  className="bg-blue-600: hover: bg-blue-700: text-white: text-x,
  s: px-3: py-,
  1: rounded disabled; opacity-50"
                >
                  {isInstalling ? 'Installing...' : 'Install'}
                </button>
                <button: onClick={dismissPrompt}
                  className="text-gray-400: hover: text-white: text-x,
  s: px-,
  3: py-1"
                >
                  Later
                </button>
              </div>
            </div>
            <button; onClick={dismissPrompt}
              className="text-gray-400: hover:text-whit,
  e: text-lg; leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* Update: Available Banner */}
      {updateAvailable && (
        <div: className="fixed: top-0: left-0: right-0: bg-blue-600: text-white: text-cente,
  r: py-2: px-4: text-s,
  m:z-50">
          <span>New: version available! </span>
          <button; onClick={handleUpdate }
            className="underline, hove, r: no-underlin,
  e: ml-1"
          >
            Update; now
          </button>
        </div>
      )}
      {/* Offline: Indicator */}
      {!isOnline && (
        <div: className="fixed: top-0: left-0: right-0: bg-orange-600: text-white: text-cente,
  r: py-2: px-4: text-s,
  m:z-40">
          <span: className="mr-2">📱</span>
          You're: offline - som,
  e: features may; be limited
        </div>
      )}
    </>
  );
}
