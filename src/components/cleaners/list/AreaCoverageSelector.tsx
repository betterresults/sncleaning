import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useCoverageAreaOptions } from '@/hooks/useCoverageAreas';

interface AreaCoverageSelectorProps {
  selectedIds: string[];
  onToggle: (boroughId: string) => void;
}

export const AreaCoverageSelector: React.FC<AreaCoverageSelectorProps> = ({ selectedIds, onToggle }) => {
  const { data: areaOptions = [] } = useCoverageAreaOptions();
  const [filter, setFilter] = useState('');

  const visibleOptions = filter.trim()
    ? areaOptions.filter((a) => a.label.toLowerCase().includes(filter.trim().toLowerCase()))
    : areaOptions;

  return (
    <div className="space-y-2">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter areas, e.g. Camden, Essex..."
        className="h-8 max-w-xs text-sm"
      />
      <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-1">
        {visibleOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No areas match "{filter}"</p>
        ) : (
          visibleOptions.map((area) => (
            <label
              key={area.boroughId}
              className="flex items-center gap-2 text-sm bg-white/60 border rounded-md px-2 py-1.5 cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.includes(area.boroughId)}
                onCheckedChange={() => onToggle(area.boroughId)}
              />
              {area.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
};
