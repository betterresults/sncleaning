import React, { useState, useEffect } from 'react';
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
  // Also strip leading 44 (country code without +) if present
  if (cleaned.startsWith('44') && cleaned.length > 10) {
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
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(() => parsePhoneToDisplay(value));
  const [error, setError] = useState<string>('');

  // Sync displayValue when value prop changes (e.g., when customer is selected)
  useEffect(() => {
    const newDisplay = parsePhoneToDisplay(value);
    setDisplayValue(newDisplay);
  }, [value]);

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    let cleaned = input.replace(/\D/g, '');
    
    // Strip leading 44 (country code without +) if user pasted it
    if (cleaned.startsWith('44') && cleaned.length > 10) {
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

    const fullPhone = '+44' + digits;
    const result = ukPhoneSchema.safeParse(fullPhone);
    if (!result.success && digits.length > 0) {
      setError('Phone must be 10 digits');
    } else {
      setError('');
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
    validatePhone(displayValue);
  };

  return (
    <div className="space-y-1">
      <Input
        type="tel"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${className} ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};