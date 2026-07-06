import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, MapPin, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCoverageAreaOptions,
  useCleanerCoverageAreas,
  useSaveCleanerCoverageAreas,
} from '@/hooks/useCoverageAreas';

interface AvailabilityAreasPanelProps {
  cleanerId: number;
}

const getRegionKey = (label: string) => {
  const parts = label.split(' – ');
  return parts.length > 1 ? parts[0] : 'Areas';
};

const AvailabilityAreasPanel: React.FC<AvailabilityAreasPanelProps> = ({ cleanerId }) => {
  const { data: areaOptions = [], isLoading: isLoadingAreaOptions } = useCoverageAreaOptions();
  const { data: myAreaIds = [], isLoading: isLoadingMyAreas } = useCleanerCoverageAreas(cleanerId);
  const saveAreas = useSaveCleanerCoverageAreas();
  const [filter, setFilter] = useState('');

  const isLoading = isLoadingAreaOptions || isLoadingMyAreas;
  const coversEverywhere = myAreaIds.length === 0;

  const visibleOptions = filter.trim()
    ? areaOptions.filter((a) => a.label.toLowerCase().includes(filter.trim().toLowerCase()))
    : areaOptions;

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, typeof visibleOptions>();
    visibleOptions.forEach((area) => {
      const key = getRegionKey(area.label);
      const list = groups.get(key) ?? [];
      list.push(area);
      groups.set(key, list);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visibleOptions]);

  const handleToggle = (boroughId: string) => {
    const next = myAreaIds.includes(boroughId)
      ? myAreaIds.filter((id) => id !== boroughId)
      : [...myAreaIds, boroughId];
    saveAreas.mutate({ cleanerId, boroughIds: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Areas I cover
          </h3>
          <p className="text-xs text-muted-foreground">
            Only jobs in the areas you select here will be shown as a good match for you — leave everything
            unchecked to be considered for every area.
          </p>
        </div>
        {!isLoading && (
          <Badge
            variant="outline"
            className={cn(
              'w-fit gap-1 text-xs',
              coversEverywhere
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-primary/40 bg-primary/15 text-primary'
            )}
          >
            <Sparkles className="h-3 w-3" />
            {coversEverywhere ? 'Open to all areas' : `${myAreaIds.length} selected`}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search areas, e.g. Camden, Essex..."
              className="h-9 pl-8 text-sm"
            />
          </div>

          <div className="max-h-[min(50vh,420px)] space-y-4 overflow-y-auto pr-1">
            {groupedOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No areas match &quot;{filter}&quot;</p>
            ) : (
              groupedOptions.map(([region, areas]) => (
                <div key={region}>
                  {groupedOptions.length > 1 && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{region}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {areas.map((area) => {
                      const selected = myAreaIds.includes(area.boroughId);
                      const displayLabel = area.label.includes(' – ') ? area.label.split(' – ').pop()! : area.label;
                      return (
                        <button
                          key={area.boroughId}
                          type="button"
                          disabled={saveAreas.isPending}
                          onClick={() => handleToggle(area.boroughId)}
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
                          <span className="font-medium leading-snug">{displayLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityAreasPanel;
