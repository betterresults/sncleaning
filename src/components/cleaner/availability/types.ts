export type OpenHoursByDay = Map<number, Set<number>>;

export interface BookingBlock {
  id: number;
  dayOfWeek: number;
  topPx: number;
  heightPx: number;
  label: string;
  timeLabel: string;
  outsideHours: boolean;
}

export interface AvailabilityGridSharedProps {
  openHours: OpenHoursByDay;
  startHour: number;
  endHour: number;
  weekDates: Date[];
  bookingBlocksByDay: Map<number, BookingBlock[]>;
  today: Date;
  onToggleCell: (day: number, hour: number) => void;
  onToggleDay: (day: number) => void;
  onSelectBooking: (bookingId: number) => void;
}
