import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import { z } from 'zod';

// UK Phone validation: +44 followed by 10 digits
const ukPhoneSchema = z.string()
  .regex(/^\+44\d{10}$/, 'UK phone must be +44 followed by 10 digits');

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "+44 ___ ___ ____",
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(value || '');
  const [error, setError] = useState<string>('');

  const formatPhoneNumber = (input: string) => {
    // Always keep +44 prefix
    if (!input || input.length === 0) {
      return '+44';
    }

    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // Make sure it starts with +44
    if (!cleaned.startsWith('+44')) {
      // If user is typing digits, add +44 prefix
      const digitsOnly = cleaned.replace(/\D/g, '');
      cleaned = '+44' + digitsOnly;
    }
    
    // Remove any zeros immediately after +44 (user might type 0 out of habit)
    cleaned = cleaned.replace(/^\+44(0+)/, '+44');
    
    // Get just the digits after +44
    const digitsAfter44 = cleaned.substring(3);
    
    // Limit to exactly 10 digits after +44
    const limitedDigits = digitsAfter44.substring(0, 10);
    
    // Return +44 plus the limited digits
    return '+44' + limitedDigits;
  };

  const validatePhone = (phone: string) => {
    if (!phone || phone === '+44') {
      setError('');
      return;
    }

    const result = ukPhoneSchema.safeParse(phone);
    if (!result.success) {
      setError('Phone must be +44 followed by 10 digits');
    } else {
      setError('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setDisplayValue(formatted);
    onChange(formatted);
    validatePhone(formatted);
  };

  const handleFocus = () => {
    if (!displayValue) {
      const starter = '+44';
      setDisplayValue(starter);
      onChange(starter);
    }
  };

  const handleBlur = () => {
    validatePhone(displayValue);
  };

  return (
    <div className="space-y-1">
      <Input
        type="tel"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${className} ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};