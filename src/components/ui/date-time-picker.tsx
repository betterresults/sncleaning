
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({ value, onChange, placeholder = "Pick a date and time" }: DateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value);
  const [time, setTime] = useState({
    hour: value ? value.getHours() % 12 || 12 : 12,
    minute: value ? value.getMinutes() : 0,
    period: value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'AM'
  });

  const updateDateTime = (newDate?: Date, newTime?: typeof time) => {
    const dateToUse = newDate || date;
    const timeToUse = newTime || time;
    
    if (dateToUse) {
      const updatedDate = new Date(dateToUse);
      let hour = timeToUse.hour;
      if (timeToUse.period === 'PM' && hour !== 12) hour += 12;
      if (timeToUse.period === 'AM' && hour === 12) hour = 0;
      
      updatedDate.setHours(hour, timeToUse.minute, 0, 0);
      setDate(updatedDate);
      onChange(updatedDate);
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      updateDateTime(newDate);
    }
  };

  const handleTimeChange = (field: 'hour' | 'minute' | 'period', value: number | string) => {
    const newTime = { ...time, [field]: value };
    setTime(newTime);
    updateDateTime(undefined, newTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <Label className="text-xs">Hour</Label>
          <Select value={time.hour.toString()} onValueChange={(value) => handleTimeChange('hour', parseInt(value))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Minutes</Label>
          <Select value={time.minute.toString()} onValueChange={(value) => handleTimeChange('minute', parseInt(value))}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute.toString()}>
                  {minute.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Period</Label>
          <Select value={time.period} onValueChange={(value) => handleTimeChange('period', value)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            {date && format(date, 'h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
}
