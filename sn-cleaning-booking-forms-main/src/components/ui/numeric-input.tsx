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
      <div className="flex-1 text-center px-6">
        <div className="text-2xl font-bold text-foreground">
          {label}
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