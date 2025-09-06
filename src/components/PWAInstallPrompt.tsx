'use client';

import { useState, useEffect } from 'react';
import PWAService from '@/lib/pwa';
import { showSuccess, showInfo } from './ui/Notifications';

export default function PWAInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const pwaService = PWAService.getInstance();

  useEffect(() => {
    // Register service worker
    pwaService.registerServiceWorker();

    // Check if app can be installed
    const checkInstallability = async () => {
      const installable = await pwaService.canInstall();
      setCanInstall(installable);
      
      // Show install prompt after a delay if installable
      if (installable) {
        setTimeout(() => setShowPrompt(true), 10000); // Show after 10 seconds
      }
    };

    checkInstallability();

    // Set up network status listeners
    setIsOnline(pwaService.isOnline());
    
    const cleanupNetworkListeners = pwaService.addNetworkListeners(
      () => {
        setIsOnline(true);
        showSuccess('Back online! 🌐');
      },
      () => {
        setIsOnline(false);
        showInfo('You\'re offline. Some features may be limited. 📱');
      }
    );

    // Listen for PWA events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      showInfo('App update available! 🆕');
    };

    const handleAppReady = () => {
      showSuccess('App ready for offline use! 📱');
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-app-ready', handleAppReady);

    // Cleanup
    return () => {
      cleanupNetworkListeners();
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-app-ready', handleAppReady);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await pwaService.installApp();
      
      if (installed) {
        showSuccess('Astral Field installed successfully! 🎉');
        setShowPrompt(false);
        setCanInstall(false);
      } else {
        showInfo('Installation cancelled or not supported');
      }
    } catch (error) {
      console.error('Install error:', error);
      showInfo('Installation failed. Try again later.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await pwaService.updateServiceWorker();
      showSuccess('Updating app... Please wait.');
    } catch (error) {
      console.error('Update error:', error);
      showInfo('Update failed. Please refresh the page.');
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Show again in 24 hours
    setTimeout(() => setShowPrompt(true), 24 * 60 * 60 * 1000);
  };

  return (
    <>
      {/* Install Prompt */}
      {showPrompt && canInstall && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🏈</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Install Astral Field</h3>
              <p className="text-gray-300 text-xs mt-1">
                Get the full app experience with offline access and faster loading!
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
                >
                  {isInstalling ? 'Installing...' : 'Install'}
                </button>
                <button
                  onClick={dismissPrompt}
                  className="text-gray-400 hover:text-white text-xs px-3 py-1"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="text-gray-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 px-4 text-sm z-50">
          <span>New version available! </span>
          <button
            onClick={handleUpdate}
            className="underline hover:no-underline ml-1"
          >
            Update now
          </button>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white text-center py-2 px-4 text-sm z-40">
          <span className="mr-2">📱</span>
          You're offline - some features may be limited
        </div>
      )}
    </>
  );
}