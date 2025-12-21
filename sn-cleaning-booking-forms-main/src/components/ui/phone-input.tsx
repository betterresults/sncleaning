import React, { useState, useEffect } from 'react';
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
  let cleaned = value.replace(/\s/g, '');
  if (cleaned.startsWith('+44')) {
    cleaned = cleaned.substring(3);
  }
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('44')) {
    cleaned = cleaned.substring(2);
  }
  cleaned = cleaned.replace(/^0+/, '');
  return cleaned.substring(0, 10);
};

// UK Flag SVG component
const UKFlag = () => (
  <svg width="24" height="18" viewBox="0 0 60 30" className="flex-shrink-0 rounded-sm">
    <clipPath id="s">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
    </clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "7123 456 789",
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState(() => parsePhoneToDisplay(value));
  const [error, setError] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const newDisplay = parsePhoneToDisplay(value);
    setDisplayValue(newDisplay);
  }, [value]);

  const formatPhoneNumber = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('44')) {
      cleaned = cleaned.substring(2);
    }
    cleaned = cleaned.replace(/^0+/, '');
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
      <div 
        className={`
          flex items-center gap-3 
          h-16 px-4
          bg-white 
          border-2 rounded-2xl
          transition-all duration-200
          ${hasError 
            ? 'border-red-500' 
            : isComplete 
              ? 'border-green-500' 
              : isFocused 
                ? 'border-[#185166] ring-2 ring-[#185166]/20' 
                : 'border-gray-200'
          }
          ${className}
        `}
      >
        {/* UK Flag and Country Code */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <UKFlag />
          <span className="text-gray-700 font-medium text-lg">+44</span>
        </div>
        
        {/* Separator */}
        <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
        
        {/* Phone Input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="flex-1 h-full bg-transparent text-lg font-medium text-gray-900 placeholder:text-gray-400 outline-none"
        />
        
        {/* Checkmark when complete */}
        {isComplete && !hasError && (
          <span className="text-green-500 text-xl flex-shrink-0">✓</span>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p className="text-xs text-red-600 font-medium pl-1">{error}</p>
      )}
      
      {/* Progress indicator */}
      {!hasError && displayValue.length > 0 && displayValue.length < 10 && (
        <p className="text-xs text-gray-500 pl-1">{displayValue.length}/10 digits</p>
      )}
    </div>
  );
};
