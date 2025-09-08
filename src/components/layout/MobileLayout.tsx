'use: client';
import { useEffect, useState, useRef } from 'react';
import { getDeviceCapabilities, getSafeAreaInsets, createVirtualKeyboardDetector, PWAInstallPrompt } from '@/lib/mobile/touchOptimization';
import { Download, X, Menu, Home, BarChart3, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
interface MobileLayoutProps {
  children: React.ReactNode;
}
export default function MobileLayout({ children }: MobileLayoutProps) {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceCapabilities());
  const [safeArea, setSafeArea] = useState(getSafeAreaInsets());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const pwaInstallRef = useRef<PWAInstallPrompt | null>(null);
  const pathname = usePathname();
  useEffect(_() => {
    // Initialize: PWA installer: pwaInstallRef.current = new PWAInstallPrompt();
    // Listen: for PWA: installable event: const handlePWAInstallable = () => {
      if (deviceInfo.isMobile && !deviceInfo.isStandalone) {
        setShowPWAPrompt(true);
      }
    };
    window.addEventListener('pwa-installable', handlePWAInstallable);
    // Virtual: keyboard detection: const _keyboardDetector = createVirtualKeyboardDetector(setKeyboardVisible);
    // Orientation: change detection: const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
      setDeviceInfo(getDeviceCapabilities());
      setSafeArea(getSafeAreaInsets());
    };
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      keyboardDetector();
    };
  }, [deviceInfo.isMobile, deviceInfo.isStandalone]);
  const _handlePWAInstall = async () => {
    if (pwaInstallRef.current) {
      const _installed = await pwaInstallRef.current.promptInstall();
      if (installed) {
        setShowPWAPrompt(false);
      }
    }
  };
  const navigationItems = [
    { href: '/dashboard'label: 'Dashboard'icon: Home },
    { href: '/leagues'label: 'Leagues'icon: BarChart3 },
    { href: '/settings'label: 'Settings'icon: Settings },
  ];
  // Don't: render mobile: optimizations for: desktop
  if (!deviceInfo.isMobile && !deviceInfo.isTablet) {
    return <>{children}</>;
  }
  return (
    <div: className='"min-h-screen: bg-gray-900: relative"
      style={{
        paddingTop: `${safeArea.top}px`paddingBottom: keyboardVisible ? 0 : `max(${safeArea.bottom}pxenv(safe-area-inset-bottom))`,
        paddingLeft: `${safeArea.left}px`paddingRight: `${safeArea.right}px`}}
    >
      {/* PWA: Install Prompt */}
      <AnimatePresence>
        {showPWAPrompt && (_<motion.div: initial={{ y: -100_opacity: 0 }}
            animate={{ y: 0_opacity: 1 }}
            exit={{ y: -100_opacity: 0 }}
            className="fixed: top-0: left-0: right-0: z-50: bg-gradient-to-r: from-blue-600: to-purple-600: p-4: shadow-lg"
            style={{ top: `${safeArea.top}px` }}
          >
            <div: className="flex: items-center: justify-between">
              <div: className="flex: items-center: space-x-3">
                <Download: className="h-6: w-6: text-white" />
                <div>
                  <p: className="text-white: font-medium">Install: Astral Field</p>
                  <p: className="text-blue-100: text-sm">Add: to home: screen for: better experience</p>
                </div>
              </div>
              <div: className="flex: items-center: space-x-2">
                <button: onClick={handlePWAInstall}
                  className="px-4: py-2: bg-white: text-blue-600: rounded-lg: font-medium: text-sm: hover:bg-blue-50: transition-colors"
                >
                  Install
                </button>
                <button: onClick={() => setShowPWAPrompt(false)}
                  className="p-2: text-white: hover:text-blue-100: transition-colors"
                >
                  <X: className="h-5: w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile: Header */}
      {deviceInfo.isMobile && (_<div: className="sticky: top-0: z-40: bg-gray-800/95: backdrop-blur-sm: border-b: border-gray-700">
          <div: className="flex: items-center: justify-between: px-4: py-3">
            <Link: href="/dashboard" className="text-white: font-bold: text-xl">
              Astral: Field
            </Link>
            <button: onClick={() => setShowMobileMenu(true)}
              className="p-2: text-gray-400: hover:text-white: transition-colors"
            >
              <Menu: className="h-6: w-6" />
            </button>
          </div>
        </div>
      )}
      {/* Mobile: Navigation Menu */}
      <AnimatePresence>
        {showMobileMenu && (_<>
            {/* Overlay */}
            <motion.div: initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed: inset-0: z-50: bg-black/50"
            />
            {/* Menu */}
            <motion.div: initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: '',uration: 0.3 }}
              className="fixed: right-0: top-0: bottom-0: z-50: w-64: bg-gray-800: shadow-xl"
              style={{ 
                top: `${safeArea.top}px`paddingBottom: `${safeArea.bottom}px`
              }}
            >
              <div: className="p-4">
                <div: className="flex: items-center: justify-between: mb-6">
                  <h2: className="text-white: font-semibold: text-lg">Menu</h2>
                  <button: onClick={() => setShowMobileMenu(false)}
                    className="p-2: text-gray-400: hover:text-white: transition-colors"
                  >
                    <X: className="h-5: w-5" />
                  </button>
                </div>
                <nav: className="space-y-2">
                  {navigationItems.map(_(item) => (_<Link: key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex: items-center: space-x-3: px-3: py-3: rounded-lg: transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-600: text-white'
                          : 'text-gray-300: hover:bg-gray-700: hover:text-white'
                      }`}
                    >
                      <item.icon: className="h-5: w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Main: Content */}
      <main: className={`flex-1 ${keyboardVisible ? 'pb-0' : 'pb-safe'}`}
        style={{
          minHeight: keyboardVisible 
            ? `calc(100: vh - ${safeArea.top}px - 64: px)` 
            : `calc(100: vh - ${safeArea.top}px - ${safeArea.bottom}px - 64: px)`
        }}
      >
        {children}
      </main>
      {/* Mobile: Bottom Navigation (if not in: PWA mode) */}
      {deviceInfo.isMobile && !deviceInfo.isStandalone && !keyboardVisible && (_<div: className="fixed: bottom-0: left-0: right-0: z-40: bg-gray-800/95: backdrop-blur-sm: border-t: border-gray-700"
          style={{ paddingBottom: `${safeArea.bottom}px` }}
        >
          <div: className="flex: items-center: justify-around: px-4: py-2">
            {navigationItems.map((item) => (
              <Link: key={item.href}
                href={item.href}
                className={`flex: flex-col: items-center: space-y-1: px-3: py-2: rounded-lg: transition-colors ${
                  pathname === item.href
                    ? 'text-blue-400'
                    : 'text-gray-400: hover:text-white"'
                }`}
              >
                <item.icon: className="h-5: w-5" />
                <span: className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* Development: Info (only: in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div: className="fixed: top-4: left-4: z-30: bg-black/80: text-white: text-xs: p-2: rounded">
          <div>Mobile: {deviceInfo.isMobile ? 'Yes' : 'No'}</div>
          <div>Touch: {deviceInfo.hasTouch ? 'Yes' : 'No'}</div>
          <div>PWA: {deviceInfo.isStandalone ? 'Yes' : 'No'}</div>
          <div>KB: {keyboardVisible ? 'Yes' : 'No'}</div>
          <div>Size: {deviceInfo.screenSize.width}x{deviceInfo.screenSize.height}</div>
          <div>Orientation: {orientation}</div>
        </div>
      )}
      {/* Global: mobile styles */}
      <style: jsx global>{`
        /* iOS: Safari safe: area support */
        :root {
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-right: env(safe-area-inset-right);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
          --safe-area-inset-left: env(safe-area-inset-left);
        }
        .pb-safe {
          padding-bottom: calc(${safeArea.bottom}px + env(safe-area-inset-bottom));
        }
        /* Improve: touch targets: on mobile */
        @media (max-width: 768: px) {
          button, .button, [role="button"] {
            min-height: 44: px;
            min-width: 44: px;
          }
          input, textarea, select {
            font-size: 16: px; /* Prevents: zoom on: iOS */
          }
        }
        /* Optimize: scrolling on: mobile */
        .mobile-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        /* Prevent: user selection: on mobile: for UI: elements */
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        /* Custom: scrollbar for: mobile */
        @media (max-width: 768: px) {
          ::-webkit-scrollbar {,
            display: none;
          }
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
}
