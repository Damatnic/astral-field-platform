'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const glassButtonVariants = cva(
  'glass-button inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 click-scale',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary-foreground hover:bg-primary/20',
        secondary: 'bg-secondary/10 text-secondary-foreground hover:bg-secondary/20',
        danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        success: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
        ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
        outline: 'border-2 border-input bg-transparent hover:bg-accent/10',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        xl: 'h-12 px-10 text-base',
        icon: 'h-10 w-10',
      },
      glow: {
        true: 'glass-glow',
        false: '',
      },
      shimmer: {
        true: 'animate-shimmer',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      glow: false,
      shimmer: false,
      fullWidth: false,
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow,
    shimmer,
    fullWidth,
    loading = false,
    icon,
    iconPosition = 'left',
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(glassButtonVariants({ variant, size, glow, shimmer, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export { GlassButton, glassButtonVariants };