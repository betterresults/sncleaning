import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Percent,
  Sparkles,
  Clock,
} from 'lucide-react';
import { CleanerAccountActions } from '@/components/admin/CleanerAccountActions';
import { CleanerCalendarStatus } from '@/components/admin/CleanerCalendarStatus';
import type { CleanerData } from './types';
import { CleanerEditPanel } from './CleanerEditPanel';
import type { CleanerCalendarConnection } from '@/hooks/useCleanerGoogleCalendar';

interface ServiceTypeOption {
  key: string;
  label: string;
}

interface AreaOption {
  boroughId: string;
  label: string;
}

export interface CleanerCardProps {
  cleaner: CleanerData;
  isEditing: boolean;
  editData: Partial<CleanerData>;
  onEditDataChange: (data: Partial<CleanerData>) => void;
  editServiceTypeKeys: string[];
  onEditServiceTypeKeysChange: (keys: string[]) => void;
  editAreaIds: string[];
  onEditAreaIdsChange: (ids: string[]) => void;
  serviceTypes: ServiceTypeOption[];
  cleanerServiceTypeKeys: string[];
  cleanerAreaIds: string[];
  areaOptions: AreaOption[];
  calendarConnection?: CleanerCalendarConnection;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onAccountCreated: () => void;
  isSaving?: boolean;
}

export const CleanerCard: React.FC<CleanerCardProps> = ({
  cleaner,
  isEditing,
  editData,
  onEditDataChange,
  editServiceTypeKeys,
  onEditServiceTypeKeysChange,
  editAreaIds,
  onEditAreaIdsChange,
  serviceTypes,
  cleanerServiceTypeKeys,
  cleanerAreaIds,
  areaOptions,
  calendarConnection,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onAccountCreated,
  isSaving,
}) => (
  <div className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30">
    {isEditing ? (
      <CleanerEditPanel
        editData={editData}
        onEditDataChange={onEditDataChange}
        serviceTypeKeys={editServiceTypeKeys}
        onServiceTypeKeysChange={onEditServiceTypeKeysChange}
        areaIds={editAreaIds}
        onAreaIdsChange={onEditAreaIdsChange}
        serviceTypes={serviceTypes}
        onSave={onSave}
        onCancel={onCancelEdit}
        isSaving={isSaving}
      />
    ) : (
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-lg text-primary">
              {cleaner.first_name} {cleaner.last_name}
            </h3>
            {(!cleaner.phone || !cleaner.address || cleaner.DBS !== 'Yes' || !cleaner.has_account) && (
              <Badge variant="outline" className="text-xs text-amber-800 border-amber-300 bg-amber-50">
                Incomplete
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="break-all">{cleaner.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{cleaner.phone ? String(cleaner.phone) : 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{cleaner.address ? `${cleaner.address}, ${cleaner.postcode}` : 'No address'}</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-medium">
              <DollarSign className="h-4 w-4" />
              <span>£{cleaner.hourly_rate || 0}/hour</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-medium">
              <Percent className="h-4 w-4" />
              <span>{cleaner.presentage_rate || 0}% rate</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Experience: {cleaner.years || 0} years</span>
              <Badge
                variant="outline"
                className={`text-xs ${
                  cleaner.DBS === 'Yes'
                    ? 'text-green-700 border-green-300 bg-green-50'
                    : cleaner.DBS === 'Pending'
                      ? 'text-amber-700 border-amber-300 bg-amber-50'
                      : 'text-muted-foreground'
                }`}
              >
                DBS: {cleaner.DBS || 'No'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            <span className="text-muted-foreground font-medium">Services:</span>
            {cleanerServiceTypeKeys.length === 0 ? (
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                All services
              </Badge>
            ) : (
              cleanerServiceTypeKeys.map((key) => {
                const st = serviceTypes.find((s) => s.key === key);
                return (
                  <Badge key={key} variant="outline" className="text-xs">
                    {st?.label || key}
                  </Badge>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            <span className="text-muted-foreground font-medium">Areas:</span>
            {cleanerAreaIds.length === 0 ? (
              <Badge variant="outline" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />
                All areas
              </Badge>
            ) : (
              (() => {
                const labels = cleanerAreaIds.map(
                  (id) => areaOptions.find((a) => a.boroughId === id)?.label || 'Unknown'
                );
                const shown = labels.slice(0, 3);
                const remaining = labels.length - shown.length;
                return (
                  <>
                    {shown.map((label, i) => (
                      <Badge key={cleanerAreaIds[i]} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                    {remaining > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +{remaining} more
                      </Badge>
                    )}
                  </>
                );
              })()
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            <span className="text-muted-foreground font-medium">Equipment:</span>
            {cleaner.has_equipment === false ? (
              <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50">
                No own equipment
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Brings own equipment
              </Badge>
            )}
          </div>

          <CleanerCalendarStatus cleanerId={cleaner.id} connection={calendarConnection} />

          {cleaner.notes && (
            <div className="text-sm text-muted-foreground">
              <strong>Notes:</strong> {cleaner.notes}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild variant="outline" size="sm">
              <Link to={`/cleaner-availability?cleanerId=${cleaner.id}`}>
                <Clock className="h-4 w-4 mr-2" />
                Availability
              </Link>
            </Button>
            <Button onClick={onStartEdit} variant="outline" size="icon" aria-label="Edit cleaner">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button onClick={onDelete} variant="destructive" size="icon" aria-label="Delete cleaner">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <CleanerAccountActions cleaner={cleaner} onAccountCreated={onAccountCreated} />
        </div>
      </div>
    )}
  </div>
);
