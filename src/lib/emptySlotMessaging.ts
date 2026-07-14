/** Product routes for empty-slot recovery CTA. */
export const EMPTY_SLOT_QUOTE_PATH = '/quote-request';

export function getEmptySlotAvailabilityMessage(isToday: boolean): string {
  return isToday
    ? 'No available time slots for today. Same-day cleaning requires at least 2 hours notice and a cleaner who is free for your job.'
    : 'No cleaners are available on this date for your booking. Please try another date or contact us for help.';
}
