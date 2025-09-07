"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      className={`border-2 border-t-transparent border-primary-600 dark:border-primary-400 rounded-full ${sizeClasses[size]} ${className}`}
    />
  );
}

export function PageLoadingSpinner({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        {children && (
          <div className="text-gray-600 dark:text-gray-400">{children}</div>
        )}
      </div>
    </div>
  );
}

export function ContentLoadingSpinner({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {children && (
          <div className="text-gray-600 dark:text-gray-400">{children}</div>
        )}
      </div>
    </div>
  );
}

export function SkeletonLoader({ className = "" }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="animate-pulse">
        <SkeletonLoader className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4" />
        <SkeletonLoader className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2" />
        <SkeletonLoader className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="animate-pulse">
          {/* Header */}
          <div
            className="grid gap-4 mb-6"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, i) => (
              <SkeletonLoader
                key={i}
                className="h-4 bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 mb-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }, (_, colIndex) => (
                <SkeletonLoader
                  key={colIndex}
                  className="h-4 bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
