import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wrench, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceTypes } from '@/hooks/useCompanySettings';
import { useCleanerServiceTypes, useSaveCleanerServiceTypes } from '@/hooks/useCleanerServiceTypes';

interface AvailabilityServicesPanelProps {
  cleanerId: number;
}

const AvailabilityServicesPanel: React.FC<AvailabilityServicesPanelProps> = ({ cleanerId }) => {
  const { data: serviceTypes = [], isLoading: isLoadingServiceTypes } = useServiceTypes();
  const { data: myServiceKeys = [], isLoading: isLoadingMyServices } = useCleanerServiceTypes(cleanerId);
  const saveServiceTypes = useSaveCleanerServiceTypes();

  const isLoading = isLoadingServiceTypes || isLoadingMyServices;
  const offersEverything = myServiceKeys.length === 0;

  const handleToggle = (key: string) => {
    const next = myServiceKeys.includes(key)
      ? myServiceKeys.filter((k) => k !== key)
      : [...myServiceKeys, key];
    saveServiceTypes.mutate({ cleanerId, serviceTypeKeys: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Services I work on
          </h3>
          <p className="text-xs text-muted-foreground">
            Only jobs matching what you select here will be shown as a good match for you — leave everything
            unchecked to be considered for every job type.
          </p>
        </div>
        {!isLoading && (
          <Badge
            variant="outline"
            className={cn(
              'w-fit gap-1 text-xs',
              offersEverything
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-primary/40 bg-primary/15 text-primary'
            )}
          >
            <Sparkles className="h-3 w-3" />
            {offersEverything ? 'Open to all services' : `${myServiceKeys.length} selected`}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {serviceTypes.map((st) => {
            const selected = myServiceKeys.includes(st.key);
            return (
              <button
                key={st.key}
                type="button"
                disabled={saveServiceTypes.isPending}
                onClick={() => handleToggle(st.key)}
                className={cn(
                  'flex items-start gap-2 rounded-xl border p-3 text-left text-sm transition-all',
                  selected
                    ? 'border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
                <span className="font-medium leading-snug">{st.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailabilityServicesPanel;
