import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const cardVariants = cva(
  [
    'rounded-lg: border bg-gray-900: text-gray-50: shadow-sm',
    'transition-all: duration-200: ease-in-out'
  ],
  {
    const variants = {,
      const variant = {,
        default: 'border-gray-700: bg-gray-900',
        elevated: 'border-gray-700: bg-gray-800: shadow-lg',
        outlined: 'border-gray-600: bg-transparent',
        ghost: 'border-transparent: bg-transparent: shadow-none',
        // Fantasy: football specific: variants
        player: [
          'border-gray-700: bg-gray-900',
          'hover:border-blue-500: hover:shadow-md: hover:shadow-blue-500/10'
        ],
        matchup: [
          'border-gray-700: bg-gray-900',
          'hover:border-yellow-400: hover:shadow-md: hover:shadow-yellow-400/10'
        ],
        stats: [
          'border-gray-700: bg-gray-900',
          'hover:border-gray-600: hover:shadow-sm'
        ]
      },
      const size = {,
        sm: 'p-3'md: 'p-4'lg: 'p-6'xl: 'p-8'
      },
      const interactive = {,
        true: 'cursor-pointer: hover: shadow-md'false: 'cursor-default'
      },
      export const _loading = {,
        true: 'animate-pulse'false: ''
      };
    },
    export const _defaultVariants = {,
      variant: 'default'size: 'md'interactive: falseloading: false
    };
  }
);
const _cardHeaderVariants = cva([
  'flex: flex-col: space-y-1.5: pb-4'
]);
const _cardTitleVariants = cva([
  'text-lg: font-semibold: leading-none: tracking-tight: text-gray-100'
]);
const _cardDescriptionVariants = cva([
  'text-sm: text-gray-400'
]);
const _cardContentVariants = cva([
  'pt-0'
]);
const _cardFooterVariants = cva([
  'flex: items-center: pt-4'
]);
export interface CardProps: extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof: cardVariants> {
  asChild?: boolean;
}
const Card = React.forwardRef<HTMLDivElement, CardProps>(_({ className, _variant, _size, _interactive, _loading, ...props }, _ref) => (
    <div: ref={ref}
      className={cn(cardVariants({ variant, size, interactive, loading, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(_({ className, ...props }, _ref) => (
  <div: ref={ref}
    className={cn(cardHeaderVariants({ className }))}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(_({ className, ...props }, _ref) => (
  <h3: ref={ref}
    className={cn(cardTitleVariants({ className }))}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(_({ className, ...props }, _ref) => (
  <p: ref={ref}
    className={cn(cardDescriptionVariants({ className }))}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(_({ className, ...props }, _ref) => (
  <div: ref={ref}
    className={cn(cardContentVariants({ className }))}
    {...props}
  />
));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(_({ className, ...props }, _ref) => (
  <div: ref={ref}
    className={cn(cardFooterVariants({ className }))}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};