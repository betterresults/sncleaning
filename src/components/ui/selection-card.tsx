import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, LucideIcon } from "lucide-react"

export interface SelectionCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isSelected?: boolean
  icon?: React.ComponentType<any> | React.ReactNode
  label?: string
  description?: string
  value?: string
  selectedValue?: string
}

const SelectionCard = React.forwardRef<HTMLDivElement, SelectionCardProps>(
  ({ className, isSelected, icon, label, description, children, value, selectedValue, ...props }, ref) => {
    const selected = isSelected !== undefined ? isSelected : value === selectedValue;
    
    // Handle icon rendering - if it's a component class, instantiate it
    const IconComponent = typeof icon === 'function' ? (icon as React.ComponentType<any>) : null;
    const iconElement: React.ReactNode = IconComponent ? <IconComponent className="h-5 w-5" /> : (icon as React.ReactNode);
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50",
          selected
            ? "border-primary bg-primary/5"
            : "border-border bg-card",
          className
        )}
        {...props}
      >
        {selected && (
          <div className="absolute right-2 top-2">
            <Check className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex items-start gap-3">
          {iconElement && (
            <div className={cn(
              "mt-0.5",
              selected ? "text-primary" : "text-muted-foreground"
            )}>
              {iconElement}
            </div>
          )}
          <div className="flex-1">
            {label && (
              <div className={cn(
                "font-medium",
                selected ? "text-primary" : "text-foreground"
              )}>
                {label}
              </div>
            )}
            {description && (
              <div className="text-sm text-muted-foreground mt-1">
                {description}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    )
  }
)
SelectionCard.displayName = "SelectionCard"

export { SelectionCard }
