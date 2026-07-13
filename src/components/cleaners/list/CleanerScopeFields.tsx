import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useCoverageAreaOptions } from '@/hooks/useCoverageAreas';
import { AreaCoverageSelector } from './AreaCoverageSelector';
import { toggleSelectionKey } from './types';

interface ServiceTypeOption {
  key: string;
  label: string;
}

interface CleanerScopeFieldsProps {
  serviceTypes: ServiceTypeOption[];
  serviceTypeKeys: string[];
  onServiceTypeKeysChange: (keys: string[]) => void;
  areaIds: string[];
  onAreaIdsChange: (ids: string[]) => void;
  /** Optional class for service checkbox chips. */
  chipClassName?: string;
}

/**
 * Explicit "All services / All areas" toggles.
 * Empty arrays mean unrestricted (assignment treats empty as every service/area).
 * Turning All off seeds the full explicit list so admins can narrow without
 * accidentally leaving empty (= all).
 */
export function CleanerScopeFields({
  serviceTypes,
  serviceTypeKeys,
  onServiceTypeKeysChange,
  areaIds,
  onAreaIdsChange,
  chipClassName = 'flex items-center gap-2 text-sm border rounded-md px-2 py-1.5 cursor-pointer',
}: CleanerScopeFieldsProps) {
  const { data: areaOptions = [] } = useCoverageAreaOptions();
  const allServices = serviceTypeKeys.length === 0;
  const allAreas = areaIds.length === 0;

  return (
    <>
      <div>
        <div className="flex items-center justify-between border rounded-md px-3 py-2 mb-2">
          <div>
            <Label className="mb-1 block">All services</Label>
            <p className="text-xs text-muted-foreground">
              On = offer every service. Off = only the services you tick below.
            </p>
          </div>
          <Switch
            checked={allServices}
            onCheckedChange={(checked) => {
              if (checked) {
                onServiceTypeKeysChange([]);
                return;
              }
              onServiceTypeKeysChange(serviceTypes.map((st) => st.key));
            }}
          />
        </div>
        {!allServices && (
          <div className="flex flex-wrap gap-3">
            {serviceTypes.map((st) => (
              <label key={st.key} className={chipClassName}>
                <Checkbox
                  checked={serviceTypeKeys.includes(st.key)}
                  onCheckedChange={() =>
                    toggleSelectionKey(serviceTypeKeys, onServiceTypeKeysChange, st.key)
                  }
                />
                {st.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between border rounded-md px-3 py-2 mb-2">
          <div>
            <Label className="mb-1 block">All areas</Label>
            <p className="text-xs text-muted-foreground">
              On = cover every area. Off = only the areas you tick below.
            </p>
          </div>
          <Switch
            checked={allAreas}
            onCheckedChange={(checked) => {
              if (checked) {
                onAreaIdsChange([]);
                return;
              }
              onAreaIdsChange(areaOptions.map((a) => a.boroughId));
            }}
          />
        </div>
        {!allAreas && (
          <AreaCoverageSelector
            selectedIds={areaIds}
            onToggle={(boroughId) => toggleSelectionKey(areaIds, onAreaIdsChange, boroughId)}
          />
        )}
      </div>
    </>
  );
}
