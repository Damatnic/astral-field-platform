import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg border bg-gray-900 text-gray-50 shadow-sm transition-all duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'border-gray-700 bg-gray-900',
        elevated: 'border-gray-700 bg-gray-800 shadow-lg',
        outlined: 'border-gray-600 bg-transparent',
        ghost: 'border-transparent bg-transparent shadow-none',
        player: 'border-gray-700 bg-gray-900 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10',
        matchup: 'border-gray-700 bg-gray-900 hover:border-yellow-400 hover:shadow-md hover:shadow-yellow-400/10',
        stats: 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:shadow-sm'
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md',
        false: 'cursor-default'
      },
      loading: {
        true: 'animate-pulse',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
      loading: false
    }
  }
);

const cardHeaderVariants = cva('flex flex-col space-y-1.5 pb-4');

const cardTitleVariants = cva('text-lg font-semibold leading-none tracking-tight text-gray-100');

const cardDescriptionVariants = cva('text-sm text-gray-400');

const cardContentVariants = cva('');

const cardFooterVariants = cva('flex items-center pt-4');

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, loading, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, interactive, loading, className }))}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardHeaderVariants(), className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(cardTitleVariants(), className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(cardDescriptionVariants(), className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardContentVariants(), className)}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardFooterVariants(), className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants
};