import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CarpetCleaningData } from '../CarpetCleaningForm';
import { CalendarDays, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { SelectionCard } from '@/components/ui/selection-card';

interface CarpetCleaningScheduleStepProps {
  data: CarpetCleaningData;
  onUpdate: (updates: Partial<CarpetCleaningData>) => void;
  onNext: () => void;
  onBack: () => void;
  isAdminMode?: boolean;
}

export const CarpetCleaningScheduleStep: React.FC<CarpetCleaningScheduleStepProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onBack,
  isAdminMode = false
}) => {
  // Short notice charge config
  const charge48h = 15;
  const charge24h = 30;
  const charge12h = 50;
  
  // Smart calendar month display
  const getDefaultMonth = () => {
    const today = new Date();
    const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
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
      '8:00', '9:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00'
    ];

    if (isToday) {
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const minHour = twoHoursFromNow.getHours() + (twoHoursFromNow.getMinutes() > 0 ? 1 : 0);
      
      return allTimeSlots
        .filter(time => parseInt(time.split(':')[0]) >= minHour)
        .map(time => {
          const hour = parseInt(time.split(':')[0]);
          const nextHour = hour + 1;
          const formatHour = (h: number) => {
            if (h < 12) return `${h}am`;
            if (h === 12) return '12pm';
            return `${h - 12}pm`;
          };
          return `${formatHour(hour)} - ${formatHour(nextHour)}`;
        });
    }

    return allTimeSlots.map(time => {
      const hour = parseInt(time.split(':')[0]);
      const nextHour = hour + 1;
      const formatHour = (h: number) => {
        if (h < 12) return `${h}am`;
        if (h === 12) return '12pm';
        return `${h - 12}pm`;
      };
      return `${formatHour(hour)} - ${formatHour(nextHour)}`;
    });
  };

  const timeSlots = generateTimeSlots();
  const isFlexible = data.flexibility === 'flexible-time';
  
  // Calculate short notice charges
  const calculateShortNoticeCharge = () => {
    if (!data.selectedDate) return { charge: 0, notice: '', hoursUntil: 0 };
    
    const now = new Date();
    const cleaningDate = new Date(data.selectedDate);
    const isToday = cleaningDate.getDate() === now.getDate() && 
                    cleaningDate.getMonth() === now.getMonth() && 
                    cleaningDate.getFullYear() === now.getFullYear();
    
    if (data.selectedTime) {
      const timeStr = data.selectedTime.split(' - ')[0];
      const hour = parseInt(timeStr);
      const isPM = timeStr.toLowerCase().includes('pm');
      let adjustedHour = hour;
      if (isPM && hour !== 12) adjustedHour += 12;
      if (!isPM && hour === 12) adjustedHour = 0;
      cleaningDate.setHours(adjustedHour, 0, 0, 0);
    } else {
      cleaningDate.setHours(9, 0, 0, 0);
    }
    
    const hoursUntilCleaning = (cleaningDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (isToday || hoursUntilCleaning <= 12) {
      return { charge: charge12h, notice: 'Same day booking', hoursUntil: hoursUntilCleaning };
    }
    if (hoursUntilCleaning <= 24) {
      return { charge: charge24h, notice: 'Within 24 hours', hoursUntil: hoursUntilCleaning };
    }
    if (hoursUntilCleaning <= 48) {
      return { charge: charge48h, notice: 'Within 48 hours', hoursUntil: hoursUntilCleaning };
    }
    return { charge: 0, notice: '', hoursUntil: hoursUntilCleaning };
  };

  const shortNoticeInfo = calculateShortNoticeCharge();
  const hasShortNoticeCharge = shortNoticeInfo.charge > 0;

  const canContinue = data.selectedDate && (data.selectedTime || isFlexible);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Items
      </Button>

      {/* Date Selection */}
      <div>
        <h2 className="text-2xl font-bold text-slate-700 mb-4">When do you need us?</h2>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={data.selectedDate || undefined}
            onSelect={(date) => {
              onUpdate({ selectedDate: date || null, selectedTime: '' });
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            defaultMonth={getDefaultMonth()}
            className="rounded-2xl border border-border bg-card p-4"
          />
        </div>
      </div>

      {/* Short Notice Warning */}
      {hasShortNoticeCharge && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{shortNoticeInfo.notice}</strong> - A £{shortNoticeInfo.charge} short notice charge applies for bookings within {shortNoticeInfo.hoursUntil <= 12 ? '12' : shortNoticeInfo.hoursUntil <= 24 ? '24' : '48'} hours.
          </AlertDescription>
        </Alert>
      )}

      {/* Time Selection */}
      {data.selectedDate && (
        <div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Choose arrival time</h2>
          
          {/* Flexibility Toggle */}
          <div className="mb-4">
            <SelectionCard
              isSelected={isFlexible}
              onClick={() => onUpdate({ 
                flexibility: isFlexible ? 'not-flexible' : 'flexible-time',
                selectedTime: isFlexible ? '' : data.selectedTime
              })}
              className="h-auto py-3"
            >
              <div className="text-center">
                <p className="font-semibold">I'm flexible on time</p>
                <p className="text-xs text-muted-foreground">We'll confirm your slot 24h before</p>
              </div>
            </SelectionCard>
          </div>

          {!isFlexible && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.length > 0 ? (
                timeSlots.map((time) => (
                  <SelectionCard
                    key={time}
                    isSelected={data.selectedTime === time}
                    onClick={() => onUpdate({ selectedTime: time })}
                    className="h-12 text-sm"
                  >
                    {time}
                  </SelectionCard>
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-4">
                  No available time slots for today. Please select another date.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Additional Notes */}
      {data.selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Additional notes (optional)</h3>
          <Textarea
            value={data.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Any special instructions for our team..."
            className="min-h-[100px] rounded-xl"
          />
        </div>
      )}

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};
