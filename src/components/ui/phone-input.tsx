import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void
}

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
)

const parsePhoneToDisplay = (value: string): string => {
  if (!value) return ''
  let cleaned = value.replace(/\s/g, '')
  if (cleaned.startsWith('+44')) {
    cleaned = cleaned.substring(3)
  }
  cleaned = cleaned.replace(/\D/g, '')
  if (cleaned.startsWith('44')) {
    cleaned = cleaned.substring(2)
  }
  cleaned = cleaned.replace(/^0+/, '')
  return cleaned.substring(0, 10)
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, placeholder = "7123 456 789", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => parsePhoneToDisplay((value as string) || ''))
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
      const newDisplay = parsePhoneToDisplay((value as string) || '')
      setDisplayValue(newDisplay)
    }, [value])

    const formatPhoneNumber = (input: string): string => {
      let cleaned = input.replace(/\D/g, '')
      // Remove leading 44 if user types it
      if (cleaned.startsWith('44')) {
        cleaned = cleaned.substring(2)
      }
      // Remove leading 0
      cleaned = cleaned.replace(/^0+/, '')
      // Limit to 10 digits
      return cleaned.substring(0, 10)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value)
      setDisplayValue(formatted)
      const fullPhone = formatted ? `+44${formatted}` : ''
      onChange?.(fullPhone)
    }

    const handleBlur = () => {
      setIsFocused(false)
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    const isComplete = displayValue.length === 10
    const hasError = displayValue.length > 0 && displayValue.length < 10

    return (
      <div className="space-y-1">
        <div 
          className={cn(
            "flex items-center gap-3",
            "h-16 px-4",
            "bg-white",
            "border-2 rounded-2xl",
            "transition-all duration-200",
            hasError && "border-red-500",
            isComplete && !hasError && "border-green-500",
            !hasError && !isComplete && isFocused && "border-[#185166] ring-2 ring-[#185166]/20",
            !hasError && !isComplete && !isFocused && "border-gray-200",
            className
          )}
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
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className="flex-1 h-full bg-transparent text-lg font-medium text-gray-900 placeholder:text-gray-400 outline-none"
            {...props}
          />
          
          {/* Checkmark when complete */}
          {isComplete && !hasError && (
            <span className="text-green-500 text-xl flex-shrink-0">✓</span>
          )}
        </div>
        
        {/* Progress indicator */}
        {hasError && displayValue.length > 0 && (
          <p className="text-xs text-gray-500 pl-1">{displayValue.length}/10 digits</p>
        )}
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
