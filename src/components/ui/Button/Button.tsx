import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
    'transition-all duration-150 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none'
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-blue-500 text-white shadow-sm',
          'hover:bg-blue-400 hover:shadow-md',
          'active:bg-blue-600 active:shadow-sm',
          'focus-visible:ring-blue-400',
          'disabled:bg-gray-700'
        ],
        secondary: [
          'bg-yellow-400 text-gray-900 shadow-sm',
          'hover:bg-yellow-300 hover:shadow-md',
          'active:bg-yellow-500 active:shadow-sm',
          'focus-visible:ring-yellow-400',
          'disabled:bg-gray-700 disabled:text-gray-500'
        ],
        tertiary: [
          'bg-transparent text-gray-300 border border-gray-700',
          'hover:bg-gray-800 hover:text-gray-100',
          'active:bg-gray-700',
          'focus-visible:ring-gray-400',
          'disabled:border-gray-800 disabled:text-gray-600'
        ],
        ghost: [
          'bg-transparent text-gray-300',
          'hover:bg-gray-800 hover:text-gray-100',
          'active:bg-gray-700',
          'focus-visible:ring-gray-400'
        ],
        outline: [
          'bg-transparent text-gray-300 border border-gray-600',
          'hover:bg-gray-800 hover:text-gray-100 hover:border-gray-500',
          'active:bg-gray-700',
          'focus-visible:ring-gray-400',
          'disabled:border-gray-800 disabled:text-gray-600'
        ],
        destructive: [
          'bg-red-500 text-white shadow-sm',
          'hover:bg-red-400 hover:shadow-md',
          'active:bg-red-600 active:shadow-sm',
          'focus-visible:ring-red-400',
          'disabled:bg-gray-700'
        ],
        success: [
          'bg-green-500 text-white shadow-sm',
          'hover:bg-green-400 hover:shadow-md',
          'active:bg-green-600 active:shadow-sm',
          'focus-visible:ring-green-400',
          'disabled:bg-gray-700'
        ],
        // Fantasy football specific variants
        win: [
          'bg-green-500 text-white shadow-sm',
          'hover:bg-green-400 hover:shadow-md',
          'active:bg-green-600',
          'focus-visible:ring-green-400'
        ],
        loss: [
          'bg-red-500 text-white shadow-sm',
          'hover:bg-red-400 hover:shadow-md',
          'active:bg-red-600',
          'focus-visible:ring-red-400'
        ],
        projected: [
          'bg-blue-600 text-white shadow-sm',
          'hover:bg-blue-500 hover:shadow-md',
          'active:bg-blue-700',
          'focus-visible:ring-blue-400'
        ]
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10 p-0'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      },
      loading: {
        true: 'cursor-wait',
        false: 'cursor-pointer'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className="truncate">
          {loading && loadingText ? loadingText : children}
        </span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { VariantProps } from 'class-variance-authority';