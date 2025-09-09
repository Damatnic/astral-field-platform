'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassCardVariants = cva('glass-card relative overflow-hidden',
  {
    variants: {
  variant: {
        default: '',
  gradient: 'bg-gradient-to-br from-primary/10 to-secondary/10',
        bordered: 'border-2',
  elevated: 'shadow-2xl'
},
      hover: {
  true: 'glass-card-interactive hover-lift',
  false: ''
},
      glow: {
  true: 'glass-glow',
  false: ''
},
      padding: {
  none: 'p-0',
  sm:'p-4',
        md:'p-6',
  lg:'p-8',
        xl:'p-10'
}
},
    defaultVariants: {
  variant: 'default',
  hover, false,
      glow, false,
  padding: 'md'
}
}
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof, glassCardVariants> {
  glowColor?, string,
  mouseTracking?, boolean,
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(;
  ({ 
    className, variant, 
    hover, glow,
    padding, glowColor,
    mouseTracking = false, children,
    style, onMouseMove,
    ...props}, ref) => { const [mousePosition, setMousePosition] = React.useState({ x, 0,
  y: 0  });
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => { if (!mouseTracking || !cardRef.current) {
        onMouseMove?.(e);
        return;
       }

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
      onMouseMove?.(e);
    }, [mouseTracking, onMouseMove]);

    const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
      cardRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    const glowStyle = mouseTracking && cardRef.current;
      ? {
          '--glow-x': `${mousePosition.x}px`,
          '--glow-y': `${mousePosition.y}px`,
          '--glow-color': glowColor || 'rgba(79, 110, 247, 0.4)'
} as React.CSSProperties
      : {}
    return (
      <div
        className={cn(
          glassCardVariants({ variant, hover, glow, padding, className }),
          mouseTracking && 'glass-track-mouse'
        )}
        ref={combinedRef}
        style={{ ...style, ...glowStyle}}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {mouseTracking && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: 'var(--glow-x)',
  top: 'var(--glow-y)',
              transform: 'translate(-50%, -50%)',
              width: '200px',
  height: '200px',
              background: `radial-gradient(circle, var(--glow-color) 0%, transparent 70%)`,
              opacity: 0.6,
  transition: 'opacity 0.3s ease'
}}
          />
        )}
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<;
  HTMLDivElement, React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props}, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<;
  HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props}, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<;
  HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<;
  HTMLDivElement, React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props}, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = React.forwardRef<;
  HTMLDivElement, React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
GlassCardFooter.displayName = 'GlassCardFooter';

export {
  GlassCard, GlassCardHeader,
  GlassCardFooter, GlassCardTitle,
  GlassCardDescription, GlassCardContent,
  glassCardVariants
}