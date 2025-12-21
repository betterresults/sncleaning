import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

// UK Phone validation: +44 followed by 10 digits
const ukPhoneSchema = z.string()
  .regex(/^\+44\d{10}$/, 'UK phone must be +44 followed by 10 digits');

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
}

const parsePhoneToDisplay = (value: string): string => {
  if (!value) return '';
  // Remove spaces and non-digits first
  let cleaned = value.replace(/\s/g, '');
  // If it starts with +44, remove it
  if (cleaned.startsWith('+44')) {
    cleaned = cleaned.substring(3);
  }
  // Remove any remaining non-digits
  cleaned = cleaned.replace(/\D/g, '');
  // Always strip leading 44 - it's the country code entered redundantly
  if (cleaned.startsWith('44')) {
    cleaned = cleaned.substring(2);
  }
  // Remove leading zeros (convert 07xxx to 7xxx)
  cleaned = cleaned.replace(/^0+/, '');
  // Limit to 10 digits
  return cleaned.substring(0, 10);
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "7123 456 789",
  className = "",
  wrapperClassName = ""
}) => {
  const [displayValue, setDisplayValue] = useState(() => parsePhoneToDisplay(value));
  const [error, setError] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync displayValue when value prop changes (e.g., when customer is selected)
  useEffect(() => {
    const newDisplay = parsePhoneToDisplay(value);
    setDisplayValue(newDisplay);
  }, [value]);

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    let cleaned = input.replace(/\D/g, '');
    
    // Always strip leading 44 if present - user is entering country code redundantly
    // UK mobiles after +44 start with 7, so 44 at start is always the country code
    if (cleaned.startsWith('44')) {
      cleaned = cleaned.substring(2);
    }
    
    // Remove any leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // Limit to exactly 10 digits
    cleaned = cleaned.substring(0, 10);
    
    return cleaned;
  };

  const validatePhone = (digits: string) => {
    if (!digits || digits.length === 0) {
      setError('');
      return;
    }

    if (digits.length < 10) {
      setError(`${10 - digits.length} more digits needed`);
    } else {
      const fullPhone = '+44' + digits;
      const result = ukPhoneSchema.safeParse(fullPhone);
      if (!result.success) {
        setError('Invalid UK phone number');
      } else {
        setError('');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setDisplayValue(formatted);
    const fullPhone = '+44' + formatted;
    onChange(fullPhone);
    validatePhone(formatted);
  };

  const handleBlur = () => {
    setIsFocused(false);
    validatePhone(displayValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const isComplete = displayValue.length === 10;
  const hasError = error && displayValue.length > 0;

  return (
    <div className="space-y-1">
      <div className={`flex items-center rounded-2xl border-2 ${hasError ? 'border-red-500' : isComplete ? 'border-green-500' : 'border-gray-200'} ${isFocused ? 'ring-2 ring-[#185166] ring-offset-2' : ''} bg-white h-16 ${className}`}>
        <span className="pl-4 pr-2 text-gray-500 font-semibold select-none text-lg">+44</span>
        <Input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-1 h-full text-lg font-medium bg-transparent"
        />
        {isComplete && !hasError && (
          <span className="pr-4 text-green-500 text-xl">✓</span>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
      {!hasError && displayValue.length > 0 && displayValue.length < 10 && (
        <p className="text-xs text-muted-foreground">{displayValue.length}/10 digits</p>
      )}
    </div>
  );
};