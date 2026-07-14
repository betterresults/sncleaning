import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, User, Loader2, RefreshCw } from 'lucide-react';
import { useServiceTypes } from '@/hooks/useCompanySettings';
import { useAllCleanerServiceTypes } from '@/hooks/useCleanerServiceTypes';
import { useCoverageAreaOptions, useAllCleanerCoverageAreas } from '@/hooks/useCoverageAreas';
import { useAllCleanerCalendarConnections, useAdminSyncAllGoogleCalendars } from '@/hooks/useCleanerGoogleCalendar';
import { useCleanersList, useInvalidateCleanersList } from '@/hooks/queries/useCleanersList';
import { useCleanerMutations } from '@/hooks/queries/useCleanerMutations';
import {
  AddCleanerDialog,
  CleanerCard,
  DeleteCleanerDialog,
  applyCleanersListFilters,
  type CleanerData,
} from '@/components/cleaners/list';

const EnhancedCleanerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCleaner, setEditingCleaner] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<CleanerData>>({});
  const [editServiceTypeKeys, setEditServiceTypeKeys] = useState<string[]>([]);
  const [editAreaIds, setEditAreaIds] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [cleanerToDelete, setCleanerToDelete] = useState<CleanerData | null>(null);

  const { data: cleaners = [], isLoading } = useCleanersList();
  const invalidateCleanersList = useInvalidateCleanersList();
  const { updateCleaner, deleteCleaner, createCleaner } = useCleanerMutations();
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: cleanerServiceTypeMap = new Map<number, string[]>() } = useAllCleanerServiceTypes();
  const { data: areaOptions = [] } = useCoverageAreaOptions();
  const { data: cleanerCoverageAreaMap = new Map<number, string[]>() } = useAllCleanerCoverageAreas();
  const { data: cleanerCalendarConnectionMap = new Map() } = useAllCleanerCalendarConnections();
  const syncAllCalendars = useAdminSyncAllGoogleCalendars();

  const filteredCleaners = useMemo(
    () => applyCleanersListFilters(cleaners, searchTerm),
    [cleaners, searchTerm]
  );

  const startEditing = (cleaner: CleanerData) => {
    setEditingCleaner(cleaner.id);
    setEditData({
      first_name: cleaner.first_name,
      last_name: cleaner.last_name,
      email: cleaner.email,
      phone: cleaner.phone,
      address: cleaner.address,
      postcode: cleaner.postcode,
      hourly_rate: cleaner.hourly_rate,
      presentage_rate: cleaner.presentage_rate,
      services: cleaner.services,
      years: cleaner.years,
      DBS: cleaner.DBS,
      DBS_date: cleaner.DBS_date,
      has_equipment: cleaner.has_equipment ?? true,
    });
    setEditServiceTypeKeys(cleanerServiceTypeMap.get(cleaner.id) || []);
    setEditAreaIds(cleanerCoverageAreaMap.get(cleaner.id) || []);
  };

  const cancelEditing = () => {
    setEditingCleaner(null);
    setEditData({});
    setEditServiceTypeKeys([]);
    setEditAreaIds([]);
  };

  const handleSave = (cleanerId: number) => {
    updateCleaner.mutate(
      {
        cleanerId,
        data: editData,
        serviceTypeKeys: editServiceTypeKeys,
        areaIds: editAreaIds,
      },
      { onSuccess: cancelEditing }
    );
  };

  const handleConfirmDelete = (cleanerId: number) => {
    deleteCleaner.mutate(cleanerId, {
      onSuccess: () => setCleanerToDelete(null),
    });
  };

  const handleCreate = (payload: {
    cleaner: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address: string;
      postcode: string;
      hourly_rate: number;
      presentage_rate: number;
      services: string;
      years: number;
      DBS: string;
      DBS_date: string;
      has_equipment: boolean;
    };
    password?: string;
    serviceTypeKeys: string[];
    areaIds: string[];
  }) => {
    createCleaner.mutate(
      {
        cleaner: payload.cleaner,
        password: payload.password,
        serviceTypeKeys: payload.serviceTypeKeys,
        areaIds: payload.areaIds,
      },
      { onSuccess: () => setShowAddDialog(false) }
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Cleaners{' '}
            <span className="font-normal text-muted-foreground">({filteredCleaners.length})</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncAllCalendars.isPending}
            onClick={() => syncAllCalendars.mutate()}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncAllCalendars.isPending ? 'animate-spin' : ''}`} />
            Sync all calendars
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Cleaner
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search cleaners by name, email, phone, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-2 text-muted-foreground">Loading cleaners...</p>
        </div>
      ) : filteredCleaners.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          {searchTerm ? 'No cleaners found matching your search.' : 'No cleaners found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCleaners.map((cleaner) => (
            <CleanerCard
              key={cleaner.id}
              cleaner={cleaner}
              isEditing={editingCleaner === cleaner.id}
              editData={editData}
              onEditDataChange={setEditData}
              editServiceTypeKeys={editServiceTypeKeys}
              onEditServiceTypeKeysChange={setEditServiceTypeKeys}
              editAreaIds={editAreaIds}
              onEditAreaIdsChange={setEditAreaIds}
              serviceTypes={serviceTypes}
              cleanerServiceTypeKeys={cleanerServiceTypeMap.get(cleaner.id) || []}
              cleanerAreaIds={cleanerCoverageAreaMap.get(cleaner.id) || []}
              areaOptions={areaOptions}
              calendarConnection={cleanerCalendarConnectionMap.get(cleaner.id)}
              onStartEdit={() => startEditing(cleaner)}
              onSave={() => handleSave(cleaner.id)}
              onCancelEdit={cancelEditing}
              onDelete={() => setCleanerToDelete(cleaner)}
              onAccountCreated={invalidateCleanersList}
              isSaving={updateCleaner.isPending}
            />
          ))}
        </div>
      )}

      <AddCleanerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        serviceTypes={serviceTypes}
        onSubmit={handleCreate}
        isSubmitting={createCleaner.isPending}
      />

      <DeleteCleanerDialog
        open={!!cleanerToDelete}
        onOpenChange={(open) => {
          if (!open) setCleanerToDelete(null);
        }}
        cleaner={cleanerToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteCleaner.isPending}
      />
    </div>
  );
};

export default EnhancedCleanerManagement;
