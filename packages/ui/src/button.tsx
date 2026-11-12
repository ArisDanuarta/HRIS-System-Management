import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      primary: "bg-[#102E50] text-white hover:bg-[#0c233d] focus:ring-[#102E50]",
      secondary:
        "bg-[#F2AF3E] text-[#102E50] hover:bg-[#e09d2c] focus:ring-[#F2AF3E] font-semibold",
      destructive: "bg-[#A8281C] text-white hover:bg-[#8f2217] focus:ring-[#A8281C]",
      outline:
        "border border-[#E1E6ED] bg-white text-[#1B2430] hover:bg-[#F5F7FA] focus:ring-[#102E50]",
      ghost: "text-[#1B2430] hover:bg-[#F5F7FA] focus:ring-[#102E50]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
