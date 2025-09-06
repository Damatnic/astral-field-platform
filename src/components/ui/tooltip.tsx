import React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProviderProps {
  children: React.ReactNode;
}

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>;
};

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, className }) => {
  return (
    <div className={cn("cursor-pointer", className)} data-tooltip-trigger>
      {children}
    </div>
  );
};

const TooltipContent: React.FC<TooltipContentProps> = ({ 
  children, 
  className, 
  side = 'top', 
  align = 'center' 
}) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2', 
    left: 'right-full mr-2'
  };

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0'
  };

  return (
    <div 
      className={cn(
        "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg border border-gray-700",
        "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
        "transition-opacity duration-200",
        positionClasses[side],
        alignClasses[align],
        className
      )}
      role="tooltip"
    >
      {children}
      {/* Arrow */}
      <div className={cn(
        "absolute w-2 h-2 bg-gray-900 border border-gray-700 rotate-45",
        side === 'top' && "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0",
        side === 'right' && "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0",
        side === 'bottom' && "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0",
        side === 'left' && "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0"
      )} />
    </div>
  );
};

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
};