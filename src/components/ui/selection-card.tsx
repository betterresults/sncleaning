import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectionCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  selectedValue?: string | null;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  value,
  selectedValue,
  label,
  icon: Icon,
  className,
  ...props
}) => {
  const selected = selectedValue === value;
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/50",
        className
      )}
      {...props}
    >
      {Icon ? (
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg",
          selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <span className={cn("text-sm font-medium", selected ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </button>
  );
};

export default SelectionCard;
