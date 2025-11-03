import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface NumericInputProps {
  value: string | number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  disabled?: boolean;
  canDecrement?: boolean;
  canIncrement?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onIncrement,
  onDecrement,
  label,
  disabled = false,
  canDecrement = true,
  canIncrement = true,
}) => {
  // Split label into number and unit (e.g., "3.5h" -> "3.5" and "h")
  const numericPart = label.replace(/[^\d.]/g, '');
  const unitPart = label.replace(/[\d.]/g, '');

  return (
    <div className="flex items-center bg-card border border-border rounded-2xl p-2 w-full">
      <Button
        variant="ghost"
        size="sm"
        className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
      >
        <Minus className="h-5 w-5" />
      </Button>
      <div className="flex-1 text-center px-8">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold text-foreground">{numericPart}</span>
          <span className="text-lg font-semibold text-foreground/70">{unitPart}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary"
        onClick={onIncrement}
        disabled={disabled || !canIncrement}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
};