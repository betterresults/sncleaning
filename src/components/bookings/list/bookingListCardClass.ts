import { cn } from '@/lib/utils';

export function bookingListCardClass(urgent = false) {
  return cn(
    'overflow-hidden rounded-[14px] border-none bg-card shadow-[0_1px_4px_rgba(0,40,100,0.07)] transition-[box-shadow,transform] duration-200',
    'sm:rounded-3xl sm:shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:hover:-translate-y-1 sm:hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]',
    urgent && 'bg-gradient-to-br from-orange-100/65 to-red-100/55',
  );
}
