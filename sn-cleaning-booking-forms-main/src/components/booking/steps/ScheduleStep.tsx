import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingData } from '../BookingForm';
import { CalendarDays, Clock, Mic, AlertTriangle } from 'lucide-react';
import { useAirbnbFieldConfigs } from '@/hooks/useAirbnbFieldConfigs';
import { SelectionCard } from '@/components/ui/selection-card';

interface ScheduleStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  
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
  
  // Smart calendar month display - show next month if we're near end of current month
  const getDefaultMonth = () => {
    const today = new Date();
    const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
    // If less than 7 days left in current month, show next month
    return daysLeftInMonth < 7 
      ? new Date(today.getFullYear(), today.getMonth() + 1, 1)
      : today;
  };

  // Generate time slots based on current time for same-day booking
  const generateTimeSlots = () => {
    const now = new Date();
    const selectedDate = data.selectedDate;
    const isToday = selectedDate && 
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    const allTimeSlots = [
      '7:00', '8:00', '9:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00'
    ];

    if (isToday) {
      // For same-day booking, only show times that are at least 2 hours from now
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const minHour = twoHoursFromNow.getHours() + (twoHoursFromNow.getMinutes() > 0 ? 1 : 0);
      
      return allTimeSlots
        .filter(time => parseInt(time.split(':')[0]) >= minHour)
        .map(time => {
          const hour = parseInt(time.split(':')[0]);
          return hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
        });
    }

    // For future dates, show all time slots
    return allTimeSlots.map(time => {
      const hour = parseInt(time.split(':')[0]);
      return hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
    });
  };

  const timeSlots = generateTimeSlots();
  const isFlexible = data.flexibility === 'flexible-time';
  
  // Calculate short notice charges using dynamic configs
  const calculateShortNoticeCharge = () => {
    if (!data.selectedDate) return { charge: 0, notice: '', hoursUntil: 0 };
    
    const now = new Date();
    const cleaningDate = new Date(data.selectedDate);
    
    // Check if it's today (same-day booking)
    const isToday = cleaningDate.getDate() === now.getDate() &&
      cleaningDate.getMonth() === now.getMonth() &&
      cleaningDate.getFullYear() === now.getFullYear();

    if (isToday) {
      // For same-day bookings, if flexible or no specific time, use earliest available (now + 2h)
      if (data.selectedTime && !isFlexible) {
        const timeStr = data.selectedTime.replace(/[AP]M/, '').trim();
        const [hours, minutes] = timeStr.split(':').map(Number);
        let adjustedHours = hours;
        if (data.selectedTime.includes('PM') && hours !== 12) adjustedHours += 12;
        if (data.selectedTime.includes('AM') && hours === 12) adjustedHours = 0;
        cleaningDate.setHours(adjustedHours, minutes || 0, 0, 0);
      } else {
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        cleaningDate.setHours(twoHoursFromNow.getHours(), twoHoursFromNow.getMinutes(), 0, 0);
      }
      const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return { charge: charge12h, notice: 'Same day booking (within 12 hours)', hoursUntil: hoursUntilCleaning };
    }
    
    // Not same-day: compute hours until cleaning based on selected time or default
    if (data.selectedTime) {
      const timeStr = data.selectedTime.replace(/[AP]M/, '').trim();
      const [hours, minutes] = timeStr.split(':').map(Number);
      let adjustedHours = hours;
      if (data.selectedTime.includes('PM') && hours !== 12) adjustedHours += 12;
      if (data.selectedTime.includes('AM') && hours === 12) adjustedHours = 0;
      cleaningDate.setHours(adjustedHours, minutes || 0, 0, 0);
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
  
  const canContinue = data.selectedDate && (isFlexible || data.selectedTime);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, you would handle voice recording here
  };

  return (
    <div className="space-y-4">
      <div className="p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Cleaning Schedule
        </h2>

      {/* Calendar and Time Selection */}
      <div className={`grid gap-6 md:gap-8 ${data.selectedDate ? 'lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
        {/* Left: Calendar - Now bigger and more mobile-friendly */}
        <div className="bg-slate-800 rounded-lg p-4 md:p-8">
          <Calendar
            mode="single"
            selected={data.selectedDate || undefined}
            onSelect={(date) => onUpdate({ selectedDate: date || null })}
            defaultMonth={getDefaultMonth()}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkDate = new Date(date);
              checkDate.setHours(0, 0, 0, 0);
              return checkDate < today;
            }}
            className="rounded-md pointer-events-auto w-full scale-110 md:scale-125 origin-center [&_.rdp-day]:text-white [&_.rdp-day_button]:text-white [&_.rdp-day_button]:h-10 [&_.rdp-day_button]:w-10 md:[&_.rdp-day_button]:h-12 md:[&_.rdp-day_button]:w-12 [&_.rdp-day_button]:text-base md:[&_.rdp-day_button]:text-lg [&_.rdp-nav_button]:text-white [&_.rdp-nav_button]:h-10 [&_.rdp-nav_button]:w-10 [&_.rdp-caption]:text-white [&_.rdp-caption]:text-lg md:[&_.rdp-caption]:text-xl [&_.rdp-caption]:mb-4 [&_.rdp-head_cell]:text-white [&_.rdp-head_cell]:text-sm md:[&_.rdp-head_cell]:text-base [&_.rdp-day_button:hover]:bg-primary [&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground"
          />
        </div>

        {/* Right: Time Selection */}
        <div className="p-4 md:p-6">
          {data.selectedDate && (
            <div className="space-y-3">
              <div>
                <h3 className="-mt-1 text-lg font-semibold text-foreground">
                  {data.selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>

              {/* Time Flexibility Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <label className="text-sm font-medium text-foreground">
                  I am flexible with the start time
                </label>
                <Switch
                  checked={isFlexible}
                  onCheckedChange={(checked) => 
                    onUpdate({ 
                      flexibility: checked ? 'flexible-time' : 'not-flexible',
                      selectedTime: checked ? undefined : data.selectedTime
                    })
                  }
                />
              </div>

              {/* Time Selection - Only show if not flexible */}
              {!isFlexible && (
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={data.selectedTime === time ? 'default' : 'outline'}
                      className="h-10 md:h-12 text-xs md:text-sm"
                      onClick={() => onUpdate({ selectedTime: time })}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}

              {/* Additional Notes - Only show if flexible */}
              {isFlexible && (
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">
                    Additional timing preferences
                  </h2>
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

      {/* Same Day Booking - No Available Times Warning */}
      {data.selectedDate && (
        (() => {
          const now = new Date();
          const selectedDate = data.selectedDate;
          const isToday = selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();
          
          if (isToday && timeSlots.length === 0) {
            return (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  No available time slots for today. Same-day cleaning requires at least 2 hours notice.
                </AlertDescription>
              </Alert>
            );
          }
          
          return null;
        })()
      )}
      </div>

      {/* Property Access Section */}
      <div className="mt-8 p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Property Access
        </h2>
        <p className="text-muted-foreground mb-4">
          How will we access the property?
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <SelectionCard
            label="Meet at property"
            isSelected={data.propertyAccess === 'meet'}
            onClick={() => onUpdate({ propertyAccess: 'meet' })}
          />
          <SelectionCard
            label="Collect keys"
            isSelected={data.propertyAccess === 'collect'}
            onClick={() => onUpdate({ propertyAccess: 'collect' })}
          />
          <SelectionCard
            label="Keybox"
            isSelected={data.propertyAccess === 'keybox'}
            onClick={() => onUpdate({ propertyAccess: 'keybox' })}
          />
          <SelectionCard
            label="Other"
            isSelected={data.propertyAccess === 'other'}
            onClick={() => onUpdate({ propertyAccess: 'other' })}
          />
        </div>

        {data.propertyAccess && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional access details
            </label>
            <Textarea
              placeholder="Please provide any additional details about property access..."
              value={data.accessNotes || ''}
              onChange={(e) => onUpdate({ accessNotes: e.target.value })}
              rows={4}
            />
          </div>
        )}
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