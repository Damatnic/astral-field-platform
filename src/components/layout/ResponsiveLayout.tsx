import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import MobileNavigation from './MobileNavigation';

// Responsive breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showMobileNav?: boolean;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  className?: string;
}

// Custom hook for responsive breakpoints
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial state

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < BREAKPOINTS.md,
    isTablet: windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg,
    isDesktop: windowSize.width >= BREAKPOINTS.lg,
    isLargeDesktop: windowSize.width >= BREAKPOINTS.xl,
    isExtraLarge: windowSize.width >= BREAKPOINTS['2xl'],
  };
};

// Safe area handling for mobile devices
export const SafeAreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Set CSS custom properties for safe areas
    const updateSafeArea = () => {
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0');
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0');
      
      document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return <>{children}</>;
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showMobileNav = true,
  showSidebar = false,
  sidebarContent,
  className,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile-first responsive container classes
  const containerClasses = cn(
    'min-h-screen bg-gray-950',
    'flex flex-col', // Mobile: stack vertically
    isDesktop && 'lg:flex-row', // Desktop: side by side
    className
  );

  const mainContentClasses = cn(
    'flex-1 flex flex-col',
    'safe-area-px', // Horizontal safe area padding
    isMobile && showMobileNav && 'pb-16', // Space for mobile navigation
    isDesktop && showSidebar && 'lg:ml-64', // Space for desktop sidebar
  );

  const sidebarClasses = cn(
    'fixed inset-y-0 left-0 z-30',
    'w-64 bg-gray-900 border-r border-gray-800',
    'transform transition-transform duration-300 ease-in-out',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
    isDesktop && 'lg:translate-x-0 lg:static lg:inset-0'
  );

  return (
    <SafeAreaProvider>
      <div className={containerClasses}>
        {/* Sidebar for desktop, drawer for mobile */}
        {showSidebar && (
          <>
            <aside className={sidebarClasses}>
              <div className="h-full overflow-y-auto p-4">
                {sidebarContent}
              </div>
            </aside>

            {/* Mobile sidebar overlay */}
            {!isDesktop && sidebarOpen && (
              <div
                className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </>
        )}

        {/* Main content area */}
        <main className={mainContentClasses}>
          {/* Mobile header with sidebar toggle */}
          {isMobile && showSidebar && (
            <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-gray-100">Astral Field</h1>
                <div className="w-10" /> {/* Spacer for center alignment */}
              </div>
            </header>
          )}

          {/* Page content */}
          <div className="flex-1 safe-area-pt">
            {children}
          </div>
        </main>

        {/* Mobile navigation */}
        {isMobile && showMobileNav && (
          <MobileNavigation />
        )}
      </div>
    </SafeAreaProvider>
  );
};

// Responsive grid component for fantasy football data
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = 4,
  className,
}) => {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    `grid-cols-${columns.mobile || 1}`,
    `md:grid-cols-${columns.tablet || 2}`,
    `lg:grid-cols-${columns.desktop || 3}`,
    `xl:grid-cols-${columns.large || 4}`,
    className
  );

  return <div className={gridClasses}>{children}</div>;
};

// Responsive card component optimized for mobile
interface ResponsiveCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'compact' | 'expanded';
  className?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const { isMobile } = useResponsive();

  const cardClasses = cn(
    'bg-gray-900 border border-gray-700 rounded-lg transition-all duration-200',
    // Mobile-optimized padding and spacing
    isMobile ? (
      variant === 'compact' ? 'p-3' : 
      variant === 'expanded' ? 'p-6' : 'p-4'
    ) : (
      variant === 'compact' ? 'p-4' : 
      variant === 'expanded' ? 'p-8' : 'p-6'
    ),
    // Touch-friendly tap targets on mobile
    isMobile && 'active:bg-gray-800 touch-manipulation',
    // Hover effects on desktop
    !isMobile && 'hover:border-gray-600 hover:shadow-lg hover:shadow-blue-500/5',
    className
  );

  return <div className={cardClasses}>{children}</div>;
};

export default ResponsiveLayout;