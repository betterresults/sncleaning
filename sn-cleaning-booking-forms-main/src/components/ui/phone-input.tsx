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
  placeholder = "7123 456 789",
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(() => {
    // Initialize with digits only (no +44 shown)
    if (!value) return '';
    if (value.startsWith('+44')) return value.substring(3);
    return value;
  });
  const [error, setError] = useState<string>('');

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    let cleaned = input.replace(/\D/g, '');
    
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