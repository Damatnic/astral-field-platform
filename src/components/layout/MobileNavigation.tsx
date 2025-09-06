import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';

// Mobile navigation icons
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PlayersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MatchupsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const StatsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive, badge, onClick }) => {
  const baseClasses = [
    'flex flex-col items-center justify-center px-2 py-1 min-w-0 flex-1',
    'transition-all duration-200 ease-in-out',
    'rounded-lg relative group'
  ];

  const activeClasses = isActive
    ? 'text-blue-400 bg-blue-400/10'
    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 active:bg-gray-700/50';

  return (
    <Link href={href} className={cn(baseClasses, activeClasses)} onClick={onClick}>
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium truncate mt-1 max-w-full">
        {label}
      </span>
      {isActive && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
      )}
    </Link>
  );
};

interface MobileNavigationProps {
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  const mainNavItems = [
    { href: '/', icon: <HomeIcon />, label: 'Home' },
    { href: '/players', icon: <PlayersIcon />, label: 'Players' },
    { href: '/matchups', icon: <MatchupsIcon />, label: 'Matchups' },
    { href: '/stats', icon: <StatsIcon />, label: 'Stats' },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-gray-950/95 backdrop-blur-lg border-t border-gray-800',
        'safe-area-pb',
        className
      )}>
        <div className="flex items-center justify-around px-2 py-2">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
          <NavItem
            href="#"
            icon={<MoreIcon />}
            label="More"
            onClick={() => setIsMoreMenuOpen(true)}
          />
        </div>
      </nav>

      {/* More Menu Overlay */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-700 rounded-t-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100">More Options</h3>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { href: '/team', icon: '👥', label: 'My Team' },
                  { href: '/trades', icon: '🔄', label: 'Trades' },
                  { href: '/waivers', icon: '📝', label: 'Waivers' },
                  { href: '/league', icon: '🏆', label: 'League' },
                  { href: '/draft', icon: '🎯', label: 'Draft' },
                  { href: '/settings', icon: '⚙️', label: 'Settings' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMoreMenuOpen(false)}
                  >
                    <span className="text-2xl mb-2">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="h-safe-area-bottom bg-gray-950" />
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;