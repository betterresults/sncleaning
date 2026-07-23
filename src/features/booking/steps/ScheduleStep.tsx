import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingData } from '../AirbnbBookingForm';
import { CalendarDays, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useAirbnbFieldConfigs } from '@/hooks/useAirbnbFieldConfigs';
import { useAssignableCleanersCatalog } from '@/hooks/useAssignableCleanersCatalog';
import { useBusinessHoursRange } from '@/hooks/useSchedulingRules';
import {
  filterSlotsByCleanerAvailability,
  generateCandidateSlotLabels,
} from '@/lib/customerSlotAvailability';
import { getUKNowAsLocalDate } from '@/lib/ukTime';
import {
  EMPTY_SLOT_QUOTE_PATH,
  getEmptySlotAvailabilityMessage,
} from '@/lib/emptySlotMessaging';
import { format } from 'date-fns';

interface ScheduleStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  /** company_settings service label, e.g. "Domestic", "Air BnB" */
  serviceTypeLabel?: string | null;
  /** Job duration in hours — used to ensure the full job fits a cleaner's shift. */
  durationHours?: number | null;
  /** When known (quote URL prefill), filters slots to cleaners covering the area. */
  postcode?: string | null;
  /** When true, admin can pick any date/time regardless of cleaner availability. */
  isAdminMode?: boolean;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  serviceTypeLabel,
  durationHours,
  postcode,
  isAdminMode = false,
}) => {
  // Fetch dynamic time flexibility configs from Supabase
  const { data: timeFlexConfigs = [] } = useAirbnbFieldConfigs('Time Flexibility', true);
  
  // Get short notice charges from configs (fallback to hardcoded if not found)
  const getChargeFromConfig = (option: string, fallback: number) => {
    const config = timeFlexConfigs.find((c: any) => c.option === option);
    return config ? Number(config.value) : fallback;
  };
  
  const charge48h = getChargeFromConfig('under_48h', 15);
  const charge24h = getChargeFromConfig('under_24h', 30);
  const charge12h = getChargeFromConfig('under_12h', 50);
  
  // Calendar always opens on the current month so customers see today's date first.
  const getDefaultMonth = () => getUKNowAsLocalDate();

  const { startHour, endHour, isLoading: businessHoursLoading } = useBusinessHoursRange();
  const {
    cleaners,
    loading: cleanersLoading,
    error: cleanersError,
    areaUnverified,
  } = useAssignableCleanersCatalog(true, serviceTypeLabel, postcode);

  const candidateSlots = useMemo(
    () =>
      generateCandidateSlotLabels({
        startHour,
        endHour,
        durationHours,
        selectedDate: data.selectedDate,
      }),
    [startHour, endHour, durationHours, data.selectedDate]
  );

  const timeSlots = useMemo(() => {
    if (!data.selectedDate || cleanersLoading || businessHoursLoading || cleanersError) {
      return candidateSlots;
    }
    // Admins can book any time — availability is informational only.
    if (isAdminMode) return candidateSlots;
    return filterSlotsByCleanerAvailability(cleaners, data.selectedDate, candidateSlots, durationHours);
  }, [
    candidateSlots,
    cleaners,
    cleanersError,
    cleanersLoading,
    businessHoursLoading,
    data.selectedDate,
    durationHours,
    isAdminMode,
  ]);

  const slotsLoading = businessHoursLoading || cleanersLoading;
  const hasAvailabilityOnSelectedDate = timeSlots.length > 0;
  const noCleanerAvailable = useMemo(() => {
    if (!isAdminMode || !data.selectedDate || cleanersLoading || businessHoursLoading || cleanersError) return false;
    return filterSlotsByCleanerAvailability(cleaners, data.selectedDate, candidateSlots, durationHours).length === 0;
  }, [isAdminMode, data.selectedDate, cleanersLoading, businessHoursLoading, cleanersError, cleaners, candidateSlots, durationHours]);
  const isFlexible = data.flexibility === 'flexible-time';

  // Clear a previously picked time if it falls outside the newly filtered list.
  React.useEffect(() => {
    if (!data.selectedTime || slotsLoading) return;
    if (!timeSlots.includes(data.selectedTime)) {
      onUpdate({ selectedTime: undefined });
    }
  }, [data.selectedTime, onUpdate, slotsLoading, timeSlots]);
  
  // Calculate short notice charges using dynamic configs
  const calculateShortNoticeCharge = () => {
    if (!data.selectedDate) return { charge: 0, notice: '', hoursUntil: 0 };
    
    const now = getUKNowAsLocalDate();
    const cleaningDate = new Date(data.selectedDate);
    
    // Check if it's today (same-day booking)
    const isToday = cleaningDate.getDate() === now.getDate() &&
      cleaningDate.getMonth() === now.getMonth() &&
      cleaningDate.getFullYear() === now.getFullYear();

    if (isToday) {
      // For same-day bookings, if flexible or no specific time, use earliest available (now + 2h)
      if (data.selectedTime && !isFlexible) {
        // Parse time from format "9:00 AM" or "2:00 PM" to get the hour
        const timeMatch = data.selectedTime.match(/(\d+):00\s*(AM|PM)/i);
        if (timeMatch) {
          let adjustedHours = parseInt(timeMatch[1]);
          const isPM = timeMatch[2].toUpperCase() === 'PM';
          if (isPM && adjustedHours !== 12) adjustedHours += 12;
          if (!isPM && adjustedHours === 12) adjustedHours = 0;
          cleaningDate.setHours(adjustedHours, 0, 0, 0);
        }
      } else {
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        cleaningDate.setHours(twoHoursFromNow.getHours(), twoHoursFromNow.getMinutes(), 0, 0);
      }
      const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return { charge: charge12h, notice: 'Same day booking (within 12 hours)', hoursUntil: hoursUntilCleaning };
    }
    
    // Not same-day: compute hours until cleaning based on selected time or default
    if (data.selectedTime) {
      // Parse time from format "9:00 AM" or "2:00 PM" to get the hour
      const timeMatch = data.selectedTime.match(/(\d+):00\s*(AM|PM)/i);
      if (timeMatch) {
        let adjustedHours = parseInt(timeMatch[1]);
        const isPM = timeMatch[2].toUpperCase() === 'PM';
        if (isPM && adjustedHours !== 12) adjustedHours += 12;
        if (!isPM && adjustedHours === 12) adjustedHours = 0;
        cleaningDate.setHours(adjustedHours, 0, 0, 0);
      }
    } else {
      cleaningDate.setHours(9, 0, 0, 0);
    }

    const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilCleaning < 0) return { charge: 0, notice: '', hoursUntil: hoursUntilCleaning };
    if (hoursUntilCleaning <= 24) return { charge: charge24h, notice: 'Short notice booking (within 24 hours)', hoursUntil: hoursUntilCleaning };
    if (hoursUntilCleaning <= 48) return { charge: charge48h, notice: 'Short notice booking (within 48 hours)', hoursUntil: hoursUntilCleaning };
    return { charge: 0, notice: '', hoursUntil: hoursUntilCleaning };
  };

  const shortNoticeInfo = calculateShortNoticeCharge();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0;
  
  // Update parent with short notice charge whenever it changes
  React.useEffect(() => {
    if (shortNoticeInfo.charge !== data.shortNoticeCharge) {
      onUpdate({ shortNoticeCharge: shortNoticeInfo.charge });
    }
  }, [shortNoticeInfo.charge, data.shortNoticeCharge, onUpdate]);
  
  // Validation: check if access notes are required based on selection
  const requiresAccessNotes = ['collect', 'keybox', 'other'].includes(data.propertyAccess);
  const hasRequiredAccessNotes = !requiresAccessNotes || (data.accessNotes && data.accessNotes.trim() !== '');
  
  const canContinue =
    data.selectedDate &&
    hasAvailabilityOnSelectedDate &&
    (isFlexible || data.selectedTime) &&
    data.propertyAccess &&
    hasRequiredAccessNotes;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#185166] mb-4">
          Cleaning Schedule
        </h2>

      {/* Calendar - Full Width */}
      <div className="mb-8">
        <Calendar
          mode="single"
          selected={data.selectedDate || undefined}
          onSelect={(date) => onUpdate({ selectedDate: date || null })}
          defaultMonth={getDefaultMonth()}
          disabled={(date) => {
            const today = getUKNowAsLocalDate();
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            
            // Block past dates
            if (checkDate < today) return true;
            
            // Block holiday dates (Dec 24, Dec 25, Dec 31, Jan 1)
            const month = checkDate.getMonth();
            const day = checkDate.getDate();
            const isHoliday = 
              (month === 11 && day === 24) || // Dec 24
              (month === 11 && day === 25) || // Dec 25
              (month === 11 && day === 31) || // Dec 31
              (month === 0 && day === 1);     // Jan 1
            
            return isHoliday;
          }}
          className="rounded-2xl pointer-events-auto w-full"
        />
      </div>

      {/* Time Selection - Below Calendar */}
      {data.selectedDate && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">
              {format(data.selectedDate, 'EEEE, MMMM d')}
            </h2>
          </div>

          {/* Time Flexibility Toggle - Always visible */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <label className="text-xl font-bold text-slate-700">
              I am flexible with the start time
            </label>
            <Switch
              checked={isFlexible}
              onCheckedChange={(checked) => 
                onUpdate({ 
                  flexibility: checked ? 'flexible-time' : 'not-flexible',
                  selectedTime: checked ? '' : data.selectedTime
                })
              }
            />
          </div>

          {!postcode && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Times shown reflect cleaner availability. Area matching is applied when your postcode is known.
              </AlertDescription>
            </Alert>
          )}

          {areaUnverified && postcode && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                We could not verify coverage for postcode {postcode}. Available times may change once your address is confirmed.
              </AlertDescription>
            </Alert>
          )}

          {/* Time Selection - Only show if not flexible */}
          {!isFlexible && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Select your preferred arrival time. Only times with an available cleaner are shown.
              </p>
              {slotsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking cleaner availability…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={data.selectedTime === time ? 'default' : 'outline'}
                      className="h-12 text-xl font-semibold"
                      onClick={() => onUpdate({ selectedTime: data.selectedTime === time ? undefined : time })}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}

          {isFlexible && hasAvailabilityOnSelectedDate && !slotsLoading && (
            <p className="text-sm text-muted-foreground">
              {timeSlots.length} arrival {timeSlots.length === 1 ? 'window' : 'windows'} available on this date. We will confirm the exact start time with you.
            </p>
          )}

          {/* Same Day Turnaround - Only show for check-in/checkout when time is selected */}
          {data.selectedTime && data.serviceType === 'checkin-checkout' && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <label className="text-xl font-bold text-slate-700">
                Is this a same day turnaround?
              </label>
              <Switch
                checked={data.sameDayTurnaround || false}
                onCheckedChange={(checked) => 
                  onUpdate({ sameDayTurnaround: checked })
                }
              />
            </div>
          )}

          {/* Additional Notes - Only show if flexible */}
          {isFlexible && (
            <div>
              <label className="block text-2xl font-bold text-slate-700 mb-2">
                Additional timing preferences
              </label>
              <Textarea
                placeholder="e.g., anytime in the morning, after 2 PM, etc."
                value={data.notes || ''}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                rows={3}
              />
            </div>
          )}
        </div>
      )}
      </div>

      {/* Short Notice Charge Alert */}
      {hasShortNoticeCharge && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{shortNoticeInfo.notice}</strong> - Additional £{shortNoticeInfo.charge} charge will be added to your booking
          </AlertDescription>
        </Alert>
      )}

      {/* No available times on selected date */}
      {data.selectedDate && !slotsLoading && timeSlots.length === 0 && !isAdminMode && (
        (() => {
          const now = getUKNowAsLocalDate();
          const selectedDate = data.selectedDate;
          const isToday =
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();

          return (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 space-y-2">
                <p>
                  {isToday
                    ? getEmptySlotAvailabilityMessage(true)
                    : getEmptySlotAvailabilityMessage(false)}
                </p>
                <p>
                  Still need a clean?{' '}
                  <Link to={EMPTY_SLOT_QUOTE_PATH} className="font-semibold underline underline-offset-2">
                    Request a custom quote
                  </Link>
                  .
                </p>
              </AlertDescription>
            </Alert>
          );
        })()
      )}

      {/* Admin: warn if no cleaner is free but still allow booking */}
      {isAdminMode && noCleanerAvailable && !slotsLoading && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            No cleaner is currently available for this date/time. You can still book — assign a cleaner manually later.
          </AlertDescription>
        </Alert>
      )}

      {/* Property Access Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">
          How will we access the property?
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            className={`group relative h-24 rounded-2xl border transition-all duration-300 ${
              data.propertyAccess === 'meet'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
            onClick={() => onUpdate({ propertyAccess: 'meet' })}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-2">
                <CalendarDays className={`h-6 w-6 transition-all duration-500 ${
                  data.propertyAccess === 'meet' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                }`} />
              </div>
              <span className={`text-sm font-semibold transition-colors ${
                data.propertyAccess === 'meet' ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
              }`}>Meet at property</span>
            </div>
          </button>
          
          <button
            className={`group relative h-24 rounded-2xl border transition-all duration-300 ${
              data.propertyAccess === 'collect'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
            onClick={() => onUpdate({ propertyAccess: 'collect' })}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-2">
                <svg className={`h-6 w-6 transition-all duration-500 ${
                  data.propertyAccess === 'collect' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <span className={`text-sm font-semibold transition-colors ${
                data.propertyAccess === 'collect' ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
              }`}>Collect keys</span>
            </div>
          </button>
          
          <button
            className={`group relative h-24 rounded-2xl border transition-all duration-300 ${
              data.propertyAccess === 'keybox'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
            onClick={() => onUpdate({ propertyAccess: 'keybox' })}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-2">
                <svg className={`h-6 w-6 transition-all duration-500 ${
                  data.propertyAccess === 'keybox' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className={`text-sm font-semibold transition-colors ${
                data.propertyAccess === 'keybox' ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
              }`}>Keybox</span>
            </div>
          </button>
          
          <button
            className={`group relative h-24 rounded-2xl border transition-all duration-300 ${
              data.propertyAccess === 'other'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
            onClick={() => onUpdate({ propertyAccess: 'other' })}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-2">
                <svg className={`h-6 w-6 transition-all duration-500 ${
                  data.propertyAccess === 'other' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className={`text-sm font-semibold transition-colors ${
                data.propertyAccess === 'other' ? 'text-primary' : 'text-slate-700 group-hover:text-primary'
              }`}>Other</span>
            </div>
          </button>
        </div>

        {/* Conditional fields based on selection */}
        {data.propertyAccess === 'collect' && (
          <div className="mb-4">
            <label className="block text-2xl font-bold text-slate-700 mb-2">
              Key collection details
            </label>
            <Textarea
              placeholder="Please provide details about where and when to collect the keys..."
              value={data.accessNotes || ''}
              onChange={(e) => onUpdate({ accessNotes: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {data.propertyAccess === 'keybox' && (
          <div className="mb-4">
            <label className="block text-2xl font-bold text-slate-700 mb-2">
              Keybox access details
            </label>
            <Textarea
              placeholder="Please provide keybox location and access code..."
              value={data.accessNotes || ''}
              onChange={(e) => onUpdate({ accessNotes: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {data.propertyAccess === 'other' && (
          <div className="mb-4">
            <label className="block text-2xl font-bold text-slate-700 mb-2">
              Access details
            </label>
            <Textarea
              placeholder="Please explain how we can access the property..."
              value={data.accessNotes || ''}
              onChange={(e) => onUpdate({ accessNotes: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {/* Additional booking details - always visible */}
        <div className="mt-6">
          <label className="block text-2xl font-bold text-slate-700 mb-2">
            Additional booking details (optional)
          </label>
          <Textarea
            placeholder="Any other information you'd like us to know about this booking..."
            value={data.additionalDetails || ''}
            onChange={(e) => onUpdate({ additionalDetails: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" size="lg" onClick={onBack} className="flex items-center justify-center px-3 sm:px-6">
          <span className="hidden sm:inline">Back</span>
          <span className="sm:hidden text-lg">←</span>
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onNext}
          disabled={!canContinue}
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export { ScheduleStep };
