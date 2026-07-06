import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import { AVAILABILITY_PRESETS } from '@/hooks/useCleanerWorkingHours';
import { formatWeekRangeLabel } from './availabilityUtils';

interface AvailabilityPresetsBarProps {
  weekStart: Date;
  weekOffset: number;
  onApplyPreset: (preset: (typeof AVAILABILITY_PRESETS)[number]) => void;
  onClearWeek: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

const AvailabilityPresetsBar: React.FC<AvailabilityPresetsBarProps> = ({
  weekStart,
  weekOffset,
  onApplyPreset,
  onClearWeek,
  onPrevWeek,
  onNextWeek,
  onToday,
}) => (
  <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick set</span>
      {AVAILABILITY_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApplyPreset(preset)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          {preset.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onClearWeek}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      >
        <Eraser className="h-3 w-3" />
        Clear week
      </button>
    </div>

    <div className="flex items-center justify-between gap-1 rounded-full border border-border bg-background p-1 shadow-sm sm:justify-start">
      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onPrevWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[148px] text-center text-sm font-semibold text-foreground sm:min-w-[180px]">
        {formatWeekRangeLabel(weekStart)}
      </span>
      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {weekOffset !== 0 && (
        <Button variant="ghost" size="sm" onClick={onToday} className="ml-1 shrink-0">
          Today
        </Button>
      )}
    </div>
  </div>
);

export default AvailabilityPresetsBar;
