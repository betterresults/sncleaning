import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, placeholder = "7123 456 789", ...props }, ref) => {
    // Derive display value (digits only, without +44)
    const raw = (value as string) || "";
    let digits = raw.replace(/\D/g, "");
    if (raw.startsWith("+44")) {
      digits = digits.replace(/^44/, "");
    }
    // Cap at 10 for display
    const displayValue = digits.slice(0, 10);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let next = e.target.value.replace(/\D/g, "");
      // Remove leading 0 after +44 convention
      if (next.startsWith("0")) next = next.slice(1);
      // Limit to 10 digits strictly
      next = next.slice(0, 10);
      const full = next ? `+44${next}` : "";
      onChange?.(full);
    };

    return (
      <Input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        className={cn(className)}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
