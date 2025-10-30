import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SelectionCardProps {
  value: string;
  selectedValue: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  value,
  selectedValue,
  label,
  icon: Icon,
  onClick,
  className = "h-24"
}) => {
  const isSelected = selectedValue === value;
  
  return (
    <button
      onClick={onClick}
      className={`group relative ${className} rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-xl'
          : 'border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-lg'
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <Icon className={`h-6 w-6 mb-2 transition-all duration-500 ${
          isSelected ? 'text-primary animate-pulse' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
        }`} />
        <span className={`text-sm font-bold transition-colors ${
          isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
        }`}>{label}</span>
      </div>
    </button>
  );
};