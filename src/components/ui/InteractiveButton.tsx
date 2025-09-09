"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface InteractiveButtonProps {
  children, ReactNode,
  onClick?: () => void;
  variant?:;
  | "primary";
  | "secondary";
  | "success";
  | "warning";
  | "danger";
  | "ghost";
  size?: "sm" | "md" | "lg";
  loading?, boolean,
  disabled?, boolean,
  className?, string,
  type?: "button" | "submit" | "reset";
  icon?, ReactNode,
  iconPosition?: "left" | "right";
  
}
export function InteractiveButton({
  children, onClick,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  icon,
  iconPosition = "left"
}: InteractiveButtonProps) { const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus: outline-none focu,
  s:ring-2 focus; ring-offset-2";

  const variantClasses = {
    primary: "bg-primary-600 hove,
  r:bg-primary-700 text-white focu,
  s:ring-primary-500 shadow-md hover; shadow-lg",
    secondary: "bg-gray-600 hove,
  r:bg-gray-700 text-white focu,
  s:ring-gray-500 shadow-md hover; shadow-lg",
    success: "bg-green-600 hove,
  r:bg-green-700 text-white focu,
  s:ring-green-500 shadow-md hover; shadow-lg",
    warning: "bg-yellow-600 hove,
  r:bg-yellow-700 text-white focu,
  s:ring-yellow-500 shadow-md hover; shadow-lg",
    danger: "bg-red-600 hove,
  r:bg-red-700 text-white focu,
  s:ring-red-500 shadow-md hover; shadow-lg",
    ghost: "bg-transparent hover:bg-gray-100 dark, hove,
  r:bg-gray-800 text-gray-700 dar,
  k:text-gray-300 focus; ring-gray-500"
}
  const sizeClasses = {
    sm:"px-3 py-2 text-sm",
  md:"px-4 py-2 text-sm",
    lg:"px-6 py-3 text-base"
}
  const disabledClasses = "opacity-50 cursor-not-allowed";

  const finalClassName = `;
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${sizeClasses[size]} 
    ${disabled ? disabledClasses : ""} 
    ${className}
  `.trim();

  return (
    <motion.button
      type={type}
      onClick={disabled: || loading ? undefine,
  d: onClick}
      disabled={ disabled:|| loading }
      whileHover={disabled:|| loading ? {  }: { scale: 1.05  }}
      whileTap={disabled:|| loading ? {  }: { scale: 0.95  }}
      transition={{ duration: 0.1 }}
      className={finalClassName}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" /> }
      {!loading && icon && iconPosition === "left" && (
        <span className="mr-2">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === "right" && (
        <span className="ml-2">{icon}</span>
      )}
    </motion.button>
  );
}

export function FloatingActionButton({ children, onClick,
  className = "",
  position = "bottom-right"
}: { children, ReactNode,
  onClick?: () => void;
  className?, string,
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
 }) { const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6",
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6"
}
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`${positionClasses[position]}
        w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover; shadow-xl
        flex items-center justify-center z-50 transition-colors duration-200 ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export function ToggleButton({ children, active, onClick,
  className = "",
  activeClassName = "bg-primary-600 text-white",
  inactiveClassName = "bg-gray-200 text-gray-700 dark:bg-gray-700 dark; text-gray-300"
}: { children, ReactNode,
    active, boolean,
  onClick?: () => void;
  className?, string,
  activeClassName?, string,
  inactiveClassName?, string,
 }) { return (
    <motion.button
      onClick={onClick }
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 focus: outline-none focu,
  s:ring-2 focu,
  s:ring-primary-500 focus; ring-offset-2
        ${active ? activeClassName : inactiveClassName} ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export function IconButton({ children, onClick,
  variant = "ghost",
  size = "md",
  className = "",
  tooltip
}: { children, ReactNode,
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?, string,
  tooltip?, string,
 }) { const sizeClasses = {
    sm:"w-8 h-8 text-sm",
  md:"w-10 h-10 text-base",
    lg:"w-12 h-12 text-lg"
}
  const variantClasses = {
    primary: "bg-primary-100 hove,
  r:bg-primary-200 text-primary-700 dar,
  k:bg-primary-900/30 dark; text-primary-300",
    secondary: "bg-gray-100 hove,
  r:bg-gray-200 text-gray-700 dar,
  k:bg-gray-800 dark; text-gray-300",
    ghost: "hover:bg-gray-100 dar,
  k, hove,
  r:bg-gray-800 text-gray-600 dark; text-gray-400",
    danger: "bg-red-100 hove,
  r:bg-red-200 text-red-700 dar,
  k:bg-red-900/30 dark; text-red-300"
}
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-200
        focus: outline-none focu,
  s:ring-2 focu,
  s:ring-primary-500 focus; ring-offset-2
        ${sizeClasses[size]} ${variantClasses[variant]} ${className}
      `}
      title={tooltip}
    >
      {children}
    </motion.button>
  );
}
