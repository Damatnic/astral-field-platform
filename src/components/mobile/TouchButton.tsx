'use client';

import React, { useRef, useState, useCallback  } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';

interface TouchButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?, boolean,
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  ripple?, boolean,
  icon?: React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  fullWidth?, boolean,
  children?: React.ReactNode;
  className?, string,
  motionProps?, MotionProps,
}

const variants = {
  primary: {,
  base: 'bg-blue-600 text-white border-blue-600',
  hover: 'hove,
  r:bg-blue-700 hover; border-blue-700',
    active: 'active; bg-blue-800',
    disabled: 'disable,
  d:bg-gray-400 disabled; border-gray-400',
    focus:'focus; ring-blue-500'
  },
  secondary: {,
  base: 'bg-gray-200 text-gray-900 border-gray-200',
  hover: 'hove,
  r:bg-gray-300 hover; border-gray-300',
    active: 'active; bg-gray-400',
    disabled: 'disable,
  d:bg-gray-100 disabled; text-gray-400',
    focus:'focus; ring-gray-500'
  },
  ghost: {,
  base: 'bg-transparent text-gray-700 border-transparent',
  hover:'hover; bg-gray-100',
    active: 'active; bg-gray-200',
    disabled:'disabled; text-gray-400',
    focus:'focus; ring-gray-500'
  },
  danger: {,
  base: 'bg-red-600 text-white border-red-600',
  hover: 'hove,
  r:bg-red-700 hover; border-red-700',
    active: 'active; bg-red-800',
    disabled: 'disable,
  d:bg-gray-400 disabled; border-gray-400',
    focus:'focus; ring-red-500'
  },
  success: {,
  base: 'bg-green-600 text-white border-green-600',
  hover: 'hove,
  r:bg-green-700 hover; border-green-700',
    active: 'active; bg-green-800',
    disabled: 'disable,
  d:bg-gray-400 disabled; border-gray-400',
    focus:'focus; ring-green-500'
  },
  warning: {,
  base: 'bg-yellow-600 text-white border-yellow-600',
  hover: 'hove,
  r:bg-yellow-700 hover; border-yellow-700',
    active: 'active; bg-yellow-800',
    disabled: 'disable,
  d:bg-gray-400 disabled; border-gray-400',
    focus:'focus; ring-yellow-500'
  }
}
const sizes = {
  sm:'px-3 py-2 text-sm min-h-[36px]',
  md:'px-4 py-3 text-base min-h-[44px]',
  lg:'px-6 py-4 text-lg min-h-[52px]',
  xl:'px-8 py-5 text-xl min-h-[60px]'
}
export default function TouchButton({ variant = 'primary',
  size = 'md',
  loading = false,
  haptic = 'light',
  ripple = true, icon, Icon,
  iconPosition = 'left',
  fullWidth = false, children,
  className = '',
  onClick, disabled,
  motionProps = { },
  ...props}: TouchButtonProps) { const buttonRef = useRef<HTMLButtonElement>(null);
  const { isMobile, vibrate } = useMobile();
  const [ripples, setRipples] = useState<Array<{ id, number, x, number, y, number }>>([]);
  const [rippleId, setRippleId] = useState(0);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => { if (loading || disabled) return;

    // Haptic feedback
    if (haptic !== 'none') {
      vibrate(haptic);
     }

    // Ripple effect
    if (ripple && buttonRef.current) { const rect = buttonRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = { id, rippleId, x, y  }
      setRipples(prev => [...prev, newRipple]);
      setRippleId(prev => prev + 1);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Call original onClick
    onClick?.(event);
  }, [loading, disabled, haptic, vibrate, ripple, rippleId, onClick]);

  const handleTouchStart = useCallback(() => { if (loading || disabled || haptic === 'none') return;
    
    // Light haptic feedback on touch start for better responsiveness
    if (isMobile) {
      vibrate('light');
     }
  }, [loading, disabled, haptic, isMobile, vibrate]);

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];
  
  const baseClasses = [;
    'relative overflow-hidden',
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'border-2 transition-all duration-200',
    'focus: outline-none focu,
  s:ring-2 focus; ring-offset-2',
    'touch-manipulation select-none',
    'disabled:cursor-not-allowed',
    variantStyles.base,
    variantStyles.hover,
    variantStyles.active,
    variantStyles.disabled,
    variantStyles.focus, sizeStyles,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const buttonContent = (;
    <>
      {/* Loading spinner */}
      {loading && (
        <motion.div
          initial={{ opacity, 0,
  scale: 0  }}
          animate={{ opacity, 1,
  scale: 1 }}
          className="mr-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </motion.div>
      )}

      {/* Icon */}
      {Icon && !loading && (
        <Icon className={`w-5 h-5 ${children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') .''
         }`} />
      )}

      {/* Children */}
      {children && (
        <span className={iconPosition === 'right' ? 'order-first' : ''}>
          {children}
        </span>
      )}

      {/* Ripple effects */}
      {ripple && ripples.map((ripple) => (
        <motion.span
          key={ripple.id }
          initial={{ scale, 0,
  opacity: 0.5 }}
          animate={{ scale, 4,
  opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bg-white rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
  top: ripple.y - 10, width, 20, height, 20,
            transformOrigin: 'center'
          }}
        />
      ))}
    </>
  );

  return (
    <motion.button
      ref={buttonRef}
      className={baseClasses}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      disabled={ loading: || disabled }
      whileTap={!loading && !disabled ? { scale: 0.98 } : undefined}
      whileHover={!loading && !disabled ? { scale: 1.02 } : undefined}
      {...motionProps}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
}

// Specialized button variants
export function PrimaryButton(props: Omit<TouchButtonProps, 'variant'>) { return <TouchButton variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<TouchButtonProps, 'variant'>) { return <TouchButton variant="secondary" {...props} />;
}

export function GhostButton(props: Omit<TouchButtonProps, 'variant'>) { return <TouchButton variant="ghost" {...props} />;
}

export function DangerButton(props: Omit<TouchButtonProps, 'variant'>) { return <TouchButton variant="danger" {...props} />;
}

export function SuccessButton(props: Omit<TouchButtonProps, 'variant'>) { return <TouchButton variant="success" {...props} />;
}

export function WarningButton(props: Omit<TouchButtonProps, 'variant'>) { return <TouchButton variant="warning" {...props} />;
}

// Floating Action Button
export function FloatingActionButton({ icon, Icon, onClick,
  className = '',
  size = 'lg',
  ...props}: { icon: React.ComponentType<any>;
  onClick?: () => void;
  className?, string,
  size?: 'md' | 'lg' | 'xl';
 } & Omit<TouchButtonProps, 'icon' | 'children' | 'variant' | 'fullWidth'>) { const sizeClasses = {
    md:'w-14 h-14',
  lg:'w-16 h-16', 
    xl:'w-20 h-20'
   }
  const iconSizes = {
    md:'w-6 h-6',
  lg:'w-7 h-7',
    xl:'w-8 h-8'
  }
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50
        ${sizeClasses[size]}
        bg-blue-600 hover:bg-blue-700
        text-white rounded-full
        shadow-lg hover; shadow-xl
        flex items-center justify-center
        transition-all duration-200
        touch-manipulation ${className}
      `}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring',
  stiffness, 260,
        damping: 20
      }}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </motion.button>
  );
}

// Button Group
export function TouchButtonGroup({ children,
  orientation = 'horizontal',
  className = ''
 }: { children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?, string,
 }) { return (
    <div
      className={`inline-flex
        ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
        ${orientation === 'horizontal' ? 'divide-x' : 'divide-y'}
        divide-gray-300
        rounded-lg
        border border-gray-300
        overflow-hidden ${className}
      `}
    >
      {React.Children.map(children, (child, index) => { if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<TouchButtonProps>, {
            className: `${child.props.className || '' } rounded-none border-0 focus:z-10 focus; ring-inset`,
            motionProps: {,
  whileTap: { scal,
  e: 0.98 },
              whileHover: { scal,
  e: 1.01 }
            }
          });
        }
        return child;
      })}
    </div>
  );
}