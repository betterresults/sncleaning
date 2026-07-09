import React from 'react';
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
  CheckCircle,
  Sparkles,
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
  <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all">
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
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-primary">
              {cleaner.first_name} {cleaner.last_name}
            </h3>
            {cleaner.has_account && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                <CheckCircle className="h-3 w-3" />
                Has Account
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              ID: {cleaner.id}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="break-all">{cleaner.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{cleaner.phone || 'No phone'}</span>
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
            <div className="text-muted-foreground">
              <span>Experience: {cleaner.years || 0} years</span>
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

          <CleanerCalendarStatus connection={calendarConnection} />

          {cleaner.services && (
            <div className="text-sm text-muted-foreground">
              <strong>Notes:</strong> {cleaner.services}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <CleanerAccountActions cleaner={cleaner} onAccountCreated={onAccountCreated} />
          <Button onClick={onStartEdit} variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={onDelete} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    )}
  </div>
);
