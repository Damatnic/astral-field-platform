'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Calendar, Trophy, TrendingUp, 
  Settings, Search, DollarSign, Shuffle, 
  BarChart3, MessageCircle, Crown
} from 'lucide-react';

interface LeagueNavigationProps {
  leagueId: string;
}

export default function LeagueNavigation({ leagueId }: LeagueNavigationProps) {
  const pathname = usePathname();
  // Check if user is commissioner (in real app, this would come from context/props)
  const isCommissioner = true; // Nicholas D'Amato is commissioner
  
  const navItems = [
    { href: `/leagues/${leagueId}`, label: 'Home', icon: Home },
    { href: `/leagues/${leagueId}/roster`, label: 'My Team', icon: Users },
    { href: `/leagues/${leagueId}/players`, label: 'Players', icon: Search },
    { href: `/leagues/${leagueId}/matchup`, label: 'Matchup', icon: TrendingUp },
    { href: `/leagues/${leagueId}/standings`, label: 'Standings', icon: Trophy },
    { href: `/leagues/${leagueId}/schedule`, label: 'Schedule', icon: Calendar },
    { href: `/leagues/${leagueId}/trades`, label: 'Trades', icon: Shuffle },
    { href: `/leagues/${leagueId}/waiver`, label: 'Waiver', icon: DollarSign },
    { href: `/leagues/${leagueId}/transactions`, label: 'Moves', icon: BarChart3 },
    { href: `/leagues/${leagueId}/draft`, label: 'Draft', icon: MessageCircle },
    ...(isCommissioner ? [{ href: `/leagues/${leagueId}/commissioner`, label: 'Commissioner', icon: Crown }] : []),
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap
                  ${isActive 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}