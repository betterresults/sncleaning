import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, User, Loader2 } from 'lucide-react';
import { useServiceTypes } from '@/hooks/useCompanySettings';
import { useAllCleanerServiceTypes } from '@/hooks/useCleanerServiceTypes';
import { useCoverageAreaOptions, useAllCleanerCoverageAreas } from '@/hooks/useCoverageAreas';
import { useAllCleanerCalendarConnections } from '@/hooks/useCleanerGoogleCalendar';
import { useCleanersList, useInvalidateCleanersList } from '@/hooks/queries/useCleanersList';
import { useCleanerMutations } from '@/hooks/queries/useCleanerMutations';
import {
  AddCleanerDialog,
  CleanerCard,
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

  const { data: cleaners = [], isLoading } = useCleanersList();
  const invalidateCleanersList = useInvalidateCleanersList();
  const { updateCleaner, deleteCleaner, createCleaner } = useCleanerMutations();
  const { data: serviceTypes = [] } = useServiceTypes();
  const { data: cleanerServiceTypeMap = new Map<number, string[]>() } = useAllCleanerServiceTypes();
  const { data: areaOptions = [] } = useCoverageAreaOptions();
  const { data: cleanerCoverageAreaMap = new Map<number, string[]>() } = useAllCleanerCoverageAreas();
  const { data: cleanerCalendarConnectionMap = new Map() } = useAllCleanerCalendarConnections();

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

  const handleDelete = (cleanerId: number) => {
    if (!confirm('Are you sure you want to delete this cleaner?')) return;
    deleteCleaner.mutate(cleanerId);
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
    const { password, ...cleaner } = payload.cleaner;
    createCleaner.mutate(
      {
        cleaner,
        password,
        serviceTypeKeys: payload.serviceTypeKeys,
        areaIds: payload.areaIds,
      },
      { onSuccess: () => setShowAddDialog(false) }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cleaners ({filteredCleaners.length})
          </span>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Cleaner
          </Button>
        </CardTitle>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search cleaners by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading cleaners...</p>
          </div>
        ) : filteredCleaners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No cleaners found matching your search.' : 'No cleaners found.'}
          </div>
        ) : (
          <div className="space-y-4">
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
                onDelete={() => handleDelete(cleaner.id)}
                onAccountCreated={invalidateCleanersList}
                isSaving={updateCleaner.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>

      <AddCleanerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        serviceTypes={serviceTypes}
        onSubmit={handleCreate}
        isSubmitting={createCleaner.isPending}
      />
    </Card>
  );
};

export default EnhancedCleanerManagement;
