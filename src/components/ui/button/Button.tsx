"use client";
import React, { ReactNode, FC } from "react";

// ✅ Extend all native <button> attributes
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
}

const Button: FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  loading = false,
  type = "button", // ✅ Default
  ...rest // includes onClick, etc.
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
  };

  return (
    <button
      type={type} // ✅ Supported
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} 
        ${sizeClasses[size]} ${variantClasses[variant]} 
        ${disabled || loading ? "cursor-not-allowed opacity-50" : ""}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="animate-spin border-2 border-t-transparent border-white rounded-full w-4 h-4"></span>
      ) : (
        <>
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {children}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
