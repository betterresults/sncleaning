import * as React from "react";

export interface PhoneInputProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder, className = "" }, ref) => {
    return (
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
