import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fantasy Football specific utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPoints = (points: number): string => {
  return points.toFixed(1);
};

export const getPositionColor = (position: string): string => {
  const colors: Record<string, string> = {
    QB: 'text-purple-400',
    RB: 'text-green-400',
    WR: 'text-yellow-400',
    TE: 'text-red-400',
    K: 'text-gray-400',
    DEF: 'text-blue-400',
  };
  return colors[position.toUpperCase()] || 'text-gray-400';
};

export const getTrendingIcon = (trend: 'up' | 'down' | 'neutral'): string => {
  const icons: Record<string, string> = {
    up: '↗️',
    down: '↘️',
    neutral: '→',
  };
  return icons[trend] || '→';
};

export const getTrendingColor = (trend: 'up' | 'down' | 'neutral'): string => {
  const colors: Record<string, string> = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };
  return colors[trend] || 'text-gray-400';
};