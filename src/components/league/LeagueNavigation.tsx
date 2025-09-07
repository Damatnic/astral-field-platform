"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  Settings,
  Search,
  DollarSign,
  Shuffle,
  BarChart3,
  MessageCircle,
  Crown,
  Vote,
  MessageSquare,
  Award,
  BookOpen,
  LineChart,
  Activity,
  ChevronDown,
  MoreHorizontal,
  Target,
  Clock,
  Medal,
} from "lucide-react";

interface LeagueNavigationProps {
  leagueId: string;
}

export default function LeagueNavigation({ leagueId }: LeagueNavigationProps) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // Check if user is commissioner (in real app, this would come from context/props)
  const isCommissioner = true; // Nicholas D'Amato is commissioner

  const primaryNavItems = [
    { href: `/leagues/${leagueId}`, label: "Home", icon: Home },
    { href: `/leagues/${leagueId}/roster`, label: "My Team", icon: Users },
    { href: `/leagues/${leagueId}/players`, label: "Players", icon: Search },
    {
      href: `/leagues/${leagueId}/matchup`,
      label: "Matchup",
      icon: TrendingUp,
    },
    {
      href: `/leagues/${leagueId}/standings`,
      label: "Standings",
      icon: Trophy,
    },
    {
      href: `/leagues/${leagueId}/schedule`,
      label: "Schedule",
      icon: Calendar,
    },
    { href: `/leagues/${leagueId}/trades`, label: "Trades", icon: Shuffle },
    { href: `/leagues/${leagueId}/waiver`, label: "Waiver", icon: DollarSign },
    { href: `/leagues/${leagueId}/draft`, label: "Draft", icon: MessageCircle },
  ];

  const moreNavItems = [
    {
      href: `/leagues/${leagueId}/research`,
      label: "Research Hub",
      icon: Target,
    },
    { href: `/leagues/${leagueId}/records`, label: "Records", icon: Medal },
    {
      href: `/leagues/${leagueId}/recap/8`,
      label: "Weekly Recap",
      icon: Clock,
    },
    {
      href: `/leagues/${leagueId}/board`,
      label: "Message Board",
      icon: MessageSquare,
    },
    { href: `/leagues/${leagueId}/polls`, label: "Polls", icon: Vote },
    {
      href: `/leagues/${leagueId}/power-rankings`,
      label: "Power Rankings",
      icon: LineChart,
    },
    {
      href: `/leagues/${leagueId}/transactions`,
      label: "Transactions",
      icon: BarChart3,
    },
    {
      href: `/leagues/${leagueId}/analytics`,
      label: "Analytics",
      icon: Activity,
    },
    { href: `/leagues/${leagueId}/tools`, label: "Tools", icon: Settings },
    ...(isCommissioner
      ? [
          {
            href: `/leagues/${leagueId}/settings`,
            label: "League Settings",
            icon: Settings,
          },
          {
            href: `/leagues/${leagueId}/commissioner`,
            label: "Commissioner",
            icon: Crown,
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-6 overflow-x-auto">
          {primaryNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap
                  ${
                    isActive
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              onBlur={() => setTimeout(() => setShowMoreMenu(false), 200)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap
                ${
                  showMoreMenu
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>More</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showMoreMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-2 z-50">
                {moreNavItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`
                        flex items-center space-x-3 px-4 py-2 text-sm transition-colors
                        ${
                          isActive
                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
