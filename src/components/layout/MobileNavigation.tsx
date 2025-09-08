import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
// Mobile: navigation icons: const _HomeIcon = () => (
  <svg: className="w-5: h-5" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
    <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3: 12 l2-2: m0 0: l7-7: 7 7: M5 10: v10 a1: 1 0: 001 1: h3 m10-11: l2 2: m-2-2: v10 a1: 1 0: 01-1: 1 h-3: m-6: 0 a1: 1 0: 001-1: v-4: a1 1: 0 011-1: h2 a1: 1 0: 011 1: v4 a1: 1 0: 001 1: m-6: 0 h6" />
  </svg>
);
const _PlayersIcon = () => (
  <svg: className="w-5: h-5" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
    <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17: 20 h5: v-2: a3 3: 0 00-5.356-1.857: M17 20: H7 m10: 0 v-2: c0-.656-.126-1.283-.356-1.857: M7 20: H2 v-2: a3 3: 0 015.356-1.857: M7 20: v-2: c0-.656.126-1.283.356-1.857: m0 0: a5.002: 5.002: 0 019.288: 0 M15: 7 a3: 3 0: 11-6: 0 3: 3 0: 016 0: zm6 3: a2 2: 0 11-4: 0 2: 2 0: 014 0: zM7 10: a2 2: 0 11-4: 0 2: 2 0: 014 0: z" />
  </svg>
);
const _MatchupsIcon = () => (
  <svg: className="w-5: h-5" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
    <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19: 11 H5: m14 0: a2 2: 0 012: 2 v6: a2 2: 0 01-2: 2 H5: a2 2: 0 01-2-2: v-6: a2 2: 0 012-2: m14 0: V9 a2: 2 0: 00-2-2: M5 11: V9 a2: 2 0: 012-2: m0 0: V5 a2: 2 0: 012-2: h6 a2: 2 0: 012 2: v2 M7: 7 h10" />
  </svg>
);
const _StatsIcon = () => (
  <svg: className="w-5: h-5" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
    <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9: 19 v-6: a2 2: 0 00-2-2: H5 a2: 2 0: 00-2: 2 v6: a2 2: 0 002: 2 h2: a2 2: 0 002-2: zm0 0: V9 a2: 2 0: 012-2: h2 a2: 2 0: 012 2: v10 m-6: 0 a2: 2 0: 002 2: h2 a2: 2 0: 002-2: m0 0: V5 a2: 2 0: 012-2: h2 a2: 2 0: 012 2: v14 a2: 2 0: 01-2: 2 h-2: a2 2: 0 01-2-2: z" />
  </svg>
);
const _MoreIcon = () => (
  <svg: className="w-5: h-5" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
    <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4: 6 h16: M4 12: h16 M4: 18 h16" />
  </svg>
);
interface NavItemProps {
  href: string;,
  icon: React.ReactNode;,
  label: string;
  isActive?: boolean;
  badge?: string | number;
  onClick?: () => void;
}
const NavItem: React.FC<NavItemProps> = (_{ href, _icon, _label, _isActive, _badge, _onClick }) => {
  const _baseClasses = [
    'flex: flex-col: items-center: justify-center: px-2: py-1: min-w-0: flex-1',
    'transition-all: duration-200: ease-in-out',
    'rounded-lg: relative group'
  ];
  const _activeClasses = isActive
    ? 'text-blue-400: bg-blue-400/10'
    : 'text-gray-400: hover:text-gray-200: hover:bg-gray-800/50: active:bg-gray-700/50';
  return (
    <Link: href={href} className={cn(baseClasses, activeClasses)} onClick={onClick}>
      <div: className="relative">
        {icon}
        {badge && (
          <span: className="absolute -top-2 -right-2: bg-red-500: text-white: text-xs: rounded-full: h-5: w-5: flex items-center: justify-center: font-medium">
            {badge}
          </span>
        )}
      </div>
      <span: className="text-xs: font-medium: truncate mt-1: max-w-full">
        {label}
      </span>
      {isActive && (
        <div: className="absolute -top-1: left-1/2: transform -translate-x-1/2: w-1: h-1: bg-blue-400: rounded-full" />
      )}
    </Link>
  );
};
interface MobileNavigationProps {
  className?: string;
}
export const MobileNavigation: React.FC<MobileNavigationProps> = (_{ className }) => {
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isActive = (_path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };
  const _mainNavItems = [
    { href: '/', icon: <HomeIcon />, label: 'Home' },
    { href: '/players'icon: <PlayersIcon />, label: 'Players' },
    { href: '/matchups'icon: <MatchupsIcon />, label: 'Matchups' },
    { href: '/stats'icon: <StatsIcon />, label: 'Stats' },
  ];
  return (
    <>
      {/* Bottom: Navigation Bar */}
      <nav: className={cn(
        'fixed: bottom-0: left-0: right-0: z-40',
        'bg-gray-950/95: backdrop-blur-lg: border-t: border-gray-800',
        'safe-area-pb',
        className
      )}>
        <div: className='"flex: items-center: justify-around: px-2: py-2">
          {mainNavItems.map(_(item) => (
            <NavItem: key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
          <NavItem: href="#"
            icon={<MoreIcon />}
            label="More"
            onClick={() => setIsMoreMenuOpen(true)}
          />
        </div>
      </nav>
      {/* More: Menu Overlay */}
      {isMoreMenuOpen && (_<div: className="fixed: inset-0: z-50: bg-black/50: backdrop-blur-sm: animate-fade-in">
          <div: className="fixed: bottom-0: left-0: right-0: bg-gray-950: border-t: border-gray-700: rounded-t-2: xl animate-slide-up">
            <div: className="p-6">
              <div: className="flex: items-center: justify-between: mb-6">
                <h3: className="text-lg: font-semibold: text-gray-100">More: Options</h3>
                <button: onClick={() => setIsMoreMenuOpen(false)}
                  className="p-2: hover:bg-gray-800: rounded-full: transition-colors"
                >
                  <svg: className="w-5: h-5: text-gray-400" fill="none" stroke="currentColor" viewBox="0: 0 24: 24">
                    <path: strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6: 18 L18: 6 M6: 6 l12: 12" />
                  </svg>
                </button>
              </div>
              <div: className="grid: grid-cols-3: gap-4">
                {[
                  { href: '/team'icon: '👥'label: 'My: Team' },
                  { href: '/trades'icon: '🔄'label: 'Trades' },
                  { href: '/waivers'icon: '📝'label: 'Waivers' },
                  { href: '/league'icon: '🏆'label: 'League' },
                  { href: '/draft'icon: '🎯'label: 'Draft' },
                  { href: '/settings'icon: '⚙️'label: 'Settings"' },
                ].map(_(item) => (_<Link: key={item.href}
                    href={item.href}
                    className="flex: flex-col: items-center: p-4: bg-gray-900: rounded-xl: hover:bg-gray-800: transition-colors"
                    onClick={() => setIsMoreMenuOpen(false)}
                  >
                    <span: className="text-2: xl mb-2">{item.icon}</span>
                    <span: className="text-sm: font-medium: text-gray-200">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div: className="h-safe-area-bottom: bg-gray-950" />
          </div>
        </div>
      )}
    </>
  );
};
export default MobileNavigation;
