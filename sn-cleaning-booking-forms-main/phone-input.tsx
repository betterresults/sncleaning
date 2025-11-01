import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';

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

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // If user starts typing without +44, add it
    if (!cleaned.startsWith('+44') && cleaned.length > 0) {
      // Remove any leading zeros
      cleaned = cleaned.replace(/^0+/, '');
      cleaned = '+44' + cleaned;
    }
    
    // If it starts with +44, remove any zeros immediately after
    if (cleaned.startsWith('+44')) {
      cleaned = cleaned.replace(/^\+44(0+)/, '+44');
    }
    
    // Ensure we have at least +44
    if (!cleaned && input.includes('+')) {
      cleaned = '+44';
    }
    
    // Limit to reasonable UK phone number length (+44 + 10 digits = 13 characters)
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!displayValue) {
      const starter = '+44';
      setDisplayValue(starter);
      onChange(starter);
      // Position cursor at the end
      setTimeout(() => {
        e.target.setSelectionRange(starter.length, starter.length);
      }, 0);
    }
  };

  return (
    <Input
      type="tel"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      className={className}
    />
  );
};