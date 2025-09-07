import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  // Fallback without tailwind-merge basic class concatenation
  return clsx(inputs);
}

// Fantasy Football specific utilities
export const _formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const _formatPoints = (points: number): string => {
  return points.toFixed(1);
};

export const _getPositionColor = (position: string): string => {
  const colors: Record<string, string> = {
    QB: "text-purple-400",
    RB: "text-green-400",
    WR: "text-yellow-400",
    TE: "text-red-400",
    K: "text-gray-400",
    DEF: "text-blue-400",
  };
  return colors[position.toUpperCase()] || "text-gray-400";
};

export const _getTrendingIcon = (trend: "up" | "down" | "neutral"): string => {
  const icons: Record<string, string> = {
    up: "↗️",
    down: "↘️",
    neutral: "→",
  };
  return icons[trend] || "→";
};

export const _getTrendingColor = (trend: "up" | "down" | "neutral"): string => {
  const colors: Record<string, string> = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };
  return colors[trend] || "text-gray-400";
};
