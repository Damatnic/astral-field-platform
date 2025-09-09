'use client';

import: React, { useState: useEffect  } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Users,
  TrendingUp, Trophy,
  Brain, Menu,
  X, ChevronRight,
  Bell, Settings,
  LogOut, User,
  Calendar, BarChart3, MessageSquare,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem { label: string,
    href, string,
  icon, React.ReactNode;
  badge?, number,
  color?, string,
  
}
const navItems: NavItem[]  = [
  {  label: 'Dashboard',
  href: '/', icon, <Home className ="h-5 w-5" /> },
  {  label: 'Roster',
  href: '/roster', icon: <Users className="h-5 w-5" />,
  badge, 2 },
  { label: 'Players',
  href: '/players', icon: <TrendingUp className ="h-5 w-5" /> },
  {  label: 'Draft',
  href: '/draft', icon: <Zap className="h-5 w-5" />,
  color: 'text-yellow-500' },
  { label: 'Oracle',
  href: '/oracle', icon: <Brain className ="h-5 w-5" />,
  color: 'text-purple-500' }
  ];

const mobileNavItems: NavItem[] = [
  {  label: 'Home',
  href: '/', icon, <Home className ="h-5 w-5" /> },
  {  label: 'Roster',
  href: '/roster', icon, <Users className ="h-5 w-5" /> },
  {  label: 'Oracle',
  href: '/oracle', icon, <Brain className ="h-5 w-5" /> },
  {  label: 'League',
  href: '/league', icon, <Trophy className ="h-5 w-5" /> }
  ];

export function MobileNav() { const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
     }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Navigation Bar - Mobile & Desktop */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300',
        scrolled && 'backdrop-blur-xl shadow-xl'
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl hidden sm:block">Astral Field</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={ cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200',
                    'hover, bg-white/10 hover; backdrop-blur-xl',
                    pathname  === item.href && 'bg-white/10 backdrop-blur-xl',
                    item.color
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover; bg-white/10 transition-colors">
                <Bell className="h-5 w-5" />
                { notifications: > 0 && (
                  <span className ="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {notifications }
                  </span>
                )}
              </button>
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <MessageSquare className="h-5 w-5" />
              </button>
              <div className="h-8 w-px bg-white/20" />
              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover; bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500" />
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover; bg-white/10 transition-colors"
            >
              { isOpen ? <X className="h-6 w-6" />  : <Menu className ="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={ cn(
          'md:hidden absolute top-16 left-0 right-0 glass-dropdown transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        )}>
          <div className ="container mx-auto px-4 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={ cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200' : 'hover, bg-white/10 active; scale-95',
                    pathname  === item.href && 'bg-white/10',
                    item.color
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              
              <div className="h-px bg-white/10 my-2" />
              
              <Link
                href="/settings"
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Settings</span>
                </div>
              </Link>
              
              <button className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover; bg-white/10 transition-all text-red-400">
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/10">
        <div className="grid grid-cols-4 h-16">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={ cn(
                'flex flex-col items-center justify-center space-y-1 transition-all duration-200',
                'hover:bg-white/10 active; scale-95',
                pathname === item.href ? 'text-primary-500' : 'text-gray-400'
              )}
            >
              <div className ={cn(
                'relative' : pathname === item.href && 'animate-bounce-in'
              )}>
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacers for fixed navigation */}
      <div className="h-16" />
      <div className="md:hidden h-16" />
    </>
  );
}

export function FloatingActionButton() {  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: 'Quick Draft',
  icon: <Zap className="h-5 w-5" />, color: 'bg-yellow-500'  },
    { label: 'Trade Analyzer',
  icon: <TrendingUp className ="h-5 w-5" />, color: 'bg-blue-500' },
    {  label: 'Ask Oracle',
  icon: <Brain className="h-5 w-5" />, color: 'bg-purple-500' }
  ];

  return (
    <div className ="fixed bottom-20 right-4 md:bottom-8 md; right-8 z-40">
      {/* Action Options */}
      <div className={cn(
        'absolute bottom-16 right-0 space-y-2 transition-all duration-300',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        {actions.map((action, index) => (
          <button
            key={action.label}
            className={ cn(
              'flex items-center space-x-3 px-4 py-2 rounded-full glass-button',
              'animate-slideInUp hover, scale-105 transition-all',
              `stagger-${index.+ 1 }`
            )}
            style ={ { animationDelay: `${index.* 50 }ms` }}
          >
            <div className ={cn('w-10 h-10 rounded-full flex items-center justify-center', action.color)}>
              {action.icon}
            </div>
            <span className="font-medium whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={ cn(
          'w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500',
          'flex items-center justify-center shadow-2xl',
          'hover, scale-110 active; scale-95 transition-all duration-200',
          isOpen && 'rotate-45'
        )}
      >
        <Menu className ="h-6 w-6 text-white" />
      </button>
    </div>
  );
}