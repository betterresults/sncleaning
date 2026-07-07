import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CalendarDays, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilitySummaryHeaderProps {
  totalOpenHours: number;
  activeDays: number;
  conflicts: number;
  isDirty: boolean;
  isSaving: boolean;
  ready: boolean;
  onSave: () => void;
  onCancel: () => void;
  onViewConflicts?: () => void;
  showSaveButton?: boolean;
}

const AvailabilitySummaryHeader: React.FC<AvailabilitySummaryHeaderProps> = ({
  totalOpenHours,
  activeDays,
  conflicts,
  isDirty,
  isSaving,
  ready,
  onSave,
  onCancel,
  onViewConflicts,
  showSaveButton = true,
}) => (
  <div className="space-y-3">
    <div>
      <h2 className="text-lg font-semibold text-foreground">My Availability</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Set your recurring weekly hours and keep booked jobs in view while you adjust them.
      </p>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {ready && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Clock className="h-3.5 w-3.5" />
              {totalOpenHours}h open / week
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              {activeDays}/7 days
            </span>
            {conflicts > 0 && (
              <button
                type="button"
                onClick={onViewConflicts}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100"
                title="Jump to the first job outside your set hours this week"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {conflicts} outside hours
              </button>
            )}
          </>
        )}
        {isDirty && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            Unsaved changes
          </span>
        )}
      </div>

      {showSaveButton && (
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className={cn('min-w-[112px]', isDirty && 'shadow-sm')}
          >
            {isSaving ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      )}
    </div>
  </div>
);

export default AvailabilitySummaryHeader;
