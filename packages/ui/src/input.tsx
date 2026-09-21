import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-[#1B2430] mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-md transition-colors placeholder:text-[#5B6675] focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent ${
            error ? "border-[#A8281C] text-[#A8281C]" : "border-[#E1E6ED] text-[#1B2430]"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#A8281C]">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
