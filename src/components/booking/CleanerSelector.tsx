
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import CreateCleanerDialog from './CreateCleanerDialog';
import { useLinkedCleaners } from '@/hooks/useLinkedCleaners';
import { describeTimeWindow, type BookingTimeWindow } from '@/lib/cleanerAvailabilityMatch';
import { resolvePostcodeToBorough, isAreaUnverified } from '@/lib/postcodeCoverage';
import { useServiceTypes, getServiceTypeLabel } from '@/hooks/useCompanySettings';

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: number;
  coversTime?: boolean;
  hasCalendarConflict?: boolean;
  offersService?: boolean;
  coversArea?: boolean;
  coverageAreaIds?: string[];
}

interface CleanerSelectorProps {
  onCleanerSelect: (cleaner: Cleaner | null) => void;
  /** If provided, cleaners whose working hours don't cover this window are disabled in the dropdown. */
  bookingTimeWindow?: BookingTimeWindow | null;
  /**
   * The booking's `company_settings` service_type key (e.g. "domestic", "end_of_tenancy").
   * If provided, cleaners who haven't been configured to offer this service are disabled
   * in the dropdown — unlike the admin assignment dialogs (which only badge this as a soft
   * signal), a customer shouldn't be able to book a cleaner who doesn't do that kind of job.
   */
  serviceType?: string | null;
  /**
   * The booking's raw postcode. Resolved (debounced) to a coverage borough internally so
   * cleaners who aren't configured to cover that area are disabled in the dropdown — same
   * hard-block treatment as serviceType, since a cleaner outside the area literally can't
   * be dispatched there.
   */
  postcode?: string | null;
}

const CleanerSelector = ({ onCleanerSelect, bookingTimeWindow, serviceType, postcode }: CleanerSelectorProps) => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [boroughId, setBoroughId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [areaUnverified, setAreaUnverified] = useState(false);
  const { data: serviceTypes = [] } = useServiceTypes();

  // Resolve the postcode to a coverage borough, debounced so we're not hitting the
  // DB on every keystroke while the customer is still typing.
  useEffect(() => {
    const handle = setTimeout(() => {
      resolvePostcodeToBorough(postcode).then((resolved) => {
        setBoroughId(resolved?.boroughId ?? null);
        setAreaName(resolved ? (resolved.boroughName === 'General' ? resolved.regionName : resolved.boroughName) : null);
        setAreaUnverified(isAreaUnverified(postcode, resolved));
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [postcode]);

  // Use the shared hook for fetching linked cleaners
  const { cleaners: linkedCleaners, loading } = useLinkedCleaners(true, serviceType, boroughId, bookingTimeWindow);

  // Sync linked cleaners to local state
  useEffect(() => {
    if (linkedCleaners.length > 0) {
      setCleaners(linkedCleaners.map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        full_name: c.full_name || `${c.first_name} ${c.last_name}`,
        email: '',
        phone: 0,
        coversTime: c.coversTime,
        hasCalendarConflict: c.hasCalendarConflict,
        offersService: c.offersService,
        coversArea: c.coversArea,
        coverageAreaIds: c.coverageAreaIds,
      })));
    }
  }, [linkedCleaners]);

  const isAssignable = (cleaner: Cleaner) =>
    cleaner.coversTime !== false &&
    cleaner.hasCalendarConflict !== true &&
    cleaner.offersService !== false &&
    cleaner.coversArea !== false;

  // If the booking's time window or service type changes (e.g. the date/time or
  // service is edited after a cleaner was already selected) and the selected cleaner
  // no longer qualifies, clear the selection so a job can't stay assigned to someone
  // who isn't free or doesn't do that kind of work.
  useEffect(() => {
    if (!selectedCleanerId || selectedCleanerId === 'new') return;
    const current = cleaners.find((c) => c.id.toString() === selectedCleanerId);
    if (current && !isAssignable(current)) {
      setSelectedCleanerId('');
      onCleanerSelect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleaners]);

  const handleCleanerSelect = (cleanerId: string) => {
    setSelectedCleanerId(cleanerId);
    
    if (cleanerId === 'new') {
      onCleanerSelect(null);
      return;
    }

    const cleaner = cleaners.find(c => c.id.toString() === cleanerId);
    if (cleaner && !isAssignable(cleaner)) {
      // Defensive guard: disabled SelectItems already block this via the UI.
      return;
    }
    if (cleaner) {
      onCleanerSelect(cleaner);
    }
  };

  const handleCleanerCreated = (newCleaner: Cleaner) => {
    setCleaners(prev => [...prev, newCleaner]);
    setSelectedCleanerId(newCleaner.id.toString());
    onCleanerSelect(newCleaner);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cleanerSelect">Select Cleaner</Label>
        {areaUnverified && (
          <p className="text-[11px] text-muted-foreground mb-1">
            Area coverage couldn't be verified for this postcode — cleaners with restricted areas may still be shown.
          </p>
        )}
        <div className="flex gap-2">
          <Select value={selectedCleanerId} onValueChange={handleCleanerSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choose an existing cleaner or create new" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ Create New Cleaner</SelectItem>
              {loading ? (
                <SelectItem value="loading" disabled>Loading cleaners...</SelectItem>
              ) : cleaners.length === 0 ? (
                <SelectItem value="no-cleaners" disabled>No cleaners found</SelectItem>
              ) : (
                cleaners.map((cleaner) => {
                  const displayName = cleaner.full_name || `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim();
                  const coversTime = cleaner.coversTime !== false;
                  const hasCalendarConflict = cleaner.hasCalendarConflict === true;
                  const offersService = cleaner.offersService !== false;
                  const coversArea = cleaner.coversArea !== false;
                  return (
                    <SelectItem
                      key={cleaner.id}
                      value={cleaner.id.toString()}
                      disabled={!coversTime || hasCalendarConflict || !offersService || !coversArea}
                    >
                      <span className="flex items-center gap-2">
                        {displayName} {cleaner.email && `- ${cleaner.email}`}
                        {!offersService && serviceType && (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Doesn't offer {getServiceTypeLabel(serviceType, serviceTypes)}
                          </Badge>
                        )}
                        {!coversArea && areaName && (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Outside {areaName}
                          </Badge>
                        )}
                        {areaUnverified && (cleaner.coverageAreaIds?.length ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300 bg-slate-50">
                            Area not verified
                          </Badge>
                        )}
                        {!coversTime && (
                          <Badge variant="outline" className="text-[10px] text-red-700 border-red-300 bg-red-50">
                            Outside working hours
                          </Badge>
                        )}
                        {hasCalendarConflict && (
                          <Badge variant="outline" className="text-[10px] text-violet-700 border-violet-300 bg-violet-50">
                            Google Calendar busy
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          
          <CreateCleanerDialog onCleanerCreated={handleCleanerCreated}>
            <Button type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </CreateCleanerDialog>
        </div>
      </div>
    </div>
  );
};

export default CleanerSelector;
