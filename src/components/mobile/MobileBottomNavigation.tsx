'use client';

import React, { useState, useEffect  } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, 
  TrendingUp, Calendar,
  Settings, Plus,
  MessageCircle, Bell, Search,
  BarChart3
} from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';

interface NavItem {
  href, string,
    icon: React.ComponentType<any>;
  label, string,
  badge?, number,
  color?, string,
  requiresAuth?, boolean,
  
}
const navigationItems: NavItem[] = [;
  { 
    href: '/dashboard',
  icon, Home, 
    label: 'Home',
  color: '#3B82F6'
  },
  { 
    href: '/leagues',
  icon, Users, 
    label: 'Leagues',
  color: '#10B981'
  },
  { 
    href: '/live',
  icon, TrendingUp, 
    label: 'Live',
  color: '#F59E0B',
    badge: 0 ; // Will be updated with live scores
  },
  { 
    href '/players',
  icon, Search, 
    label: 'Players',
  color: '#8B5CF6'
  },
  { 
    href: '/more',
  icon, Settings, 
    label: 'More',
  color: '#6B7280'
  }
];

const quickActions: NavItem[] = [;
  { 
    href: '/draft',
  icon, Plus, 
    label: 'Draft',
  color: '#EF4444'
  },
  { 
    href: '/chat',
  icon, MessageCircle, 
    label: 'Chat',
  color: '#06B6D4'
  },
  { 
    href: '/stats',
  icon, BarChart3, 
    label: 'Stats',
  color: '#84CC16'
  }
];

export default function MobileBottomNavigation() { const pathname = usePathname();
  const { isMobile, vibrate, isStandalone } = useMobile();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [liveScores, setLiveScores] = useState(0);

  // Don't show on desktop or in standalone PWA mode
  if (!isMobile || isStandalone) { return null;
   }

  // Hide on certain routes
  const hideOnRoutes = ['/login', '/register', '/onboarding'];
  if (hideOnRoutes.some(route => pathname.startsWith(route))) { return null;
   }

  const handleNavClick = (item: NavItem) => {
    vibrate('light');
    
    // Track navigation
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'mobile_navigation', {
        destination: item.href,
  label: item.label
      });
    }
  }
  const toggleQuickActions = () => {
    setShowQuickActions(!showQuickActions);
    vibrate('medium');
  }
  // Update badges based on app state
  useEffect(() => {
    // Listen for live score updates
    const handleScoreUpdate = (event: CustomEvent) => {
      setLiveScores(event.detail.count || 0);
    }
    // Listen for notification updates
    const handleNotificationUpdate = (event: CustomEvent) => {
      setNotifications(event.detail.count || 0);
    }
    window.addEventListener('liveScoreUpdate', handleScoreUpdate as EventListener);
    window.addEventListener('notificationUpdate', handleNotificationUpdate as EventListener);

    return () => {
      window.removeEventListener('liveScoreUpdate', handleScoreUpdate as EventListener);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate as EventListener);
    }
  }, []);

  // Update live scores badge
  const updatedNavItems = navigationItems.map(item => 
    item.href === '/live' ? { : ..item, badge: liveScores} : item
  );

  return (
    <>
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{ opacity: 0  }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowQuickActions(false)}
            />
            
            <motion.div
              initial={{ y, 100,
  opacity: 0 }}
              animate={{ y, 0,
  opacity: 1 }}
              exit={{ y, 100,
  opacity: 0 }}
              transition={{ type: 'spring',
  damping, 25, stiffness: 500 }}
              className="fixed bottom-20 left-4 right-4 z-50"
            >
              <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-3">Quick Actions</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {quickActions.map((action) => { const Icon = action.icon;
                      return (
                        <Link
                          key={action.href }
                          href={action.href}
                          onClick={() => {
                            handleNavClick(action);
                            setShowQuickActions(false);
                          }}
                          className="flex flex-col items-center p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-colors touch-manipulation"
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                            style={{ backgroundColor: `${action.color}20` }}
                          >
                            <Icon 
                              className="w-6 h-6"
                              style={{ color: action.color }}
                            />
                          </div>
                          <span className="text-xs text-gray-300 font-medium">
                            {action.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring',
  damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {updatedNavItems.map((item, index) => { const Icon = item.icon;
            const isActive = pathname === item.href || ;
                           (item.href !== '/' && pathname.startsWith(item.href));
            
            // Special handling for "More" button
            if (item.href === '/more') {
              return (
                <button
                  key={item.href }
                  onClick={toggleQuickActions}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 touch-manipulation ${showQuickActions ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover.text-gray-300'
                   }`}
                >
                  <motion.div
                    animate={showQuickActions ? { rotate: 45   }: { rotate: 0  }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="w-6 h-6" />
                  </motion.div>
                  <span className="text-xs font-medium mt-1">
                    {showQuickActions ? 'Close' : item.label}
                  </span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 touch-manipulation ${isActive ? 'text-blue-400' : 'text-gray-500 hover.text-gray-300'
                 }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600/20 rounded-xl"
                    initial={false }
                    transition={{ type: 'spring',
  damping, 30, stiffness: 500 }}
                  />
                )}
                
                {/* Icon with badge */}
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  
                  {/* Badge for notifications or live scores */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.div>
                  )}
                  
                  {/* Notification badge for certain items */}
                  {item.href === '/chat' && notifications > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full"
                    />
                  )}
                </div>
                
                <span className="text-xs font-medium mt-1 relative z-10">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Notifications indicator */}
        { notifications: > 0 && (
          <motion.div
            initial={{ opacity: 0  }}
            animate={{ opacity: 1 }}
            className="absolute top-0 right-4 transform -translate-y-1/2"
          >
            <Link
              href="/notifications"
              className="bg-red-500 text-white p-2 rounded-full shadow-lg"
              onClick={() => vibrate('light')}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                {notifications}
              </span>
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom padding to prevent content from being hidden behind navigation */}
      <div className="h-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </>
  );
}