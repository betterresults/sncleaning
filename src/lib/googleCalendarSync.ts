import { supabase } from '@/integrations/supabase/client';

type CalendarSyncBody = {
  bookingId: number;
  cleanerId?: number;
  action?: 'delete';
};

const invokeBookingCalendarSync = async (body: CalendarSyncBody) => {
  const { error } = await supabase.functions.invoke('sync-booking-to-google-calendar', { body });
  if (error) throw error;
};

export const syncBookingGoogleCalendar = async (bookingId: number) => {
  await invokeBookingCalendarSync({ bookingId });
};

export const deleteBookingGoogleCalendar = async (bookingId: number, cleanerId?: number) => {
  await invokeBookingCalendarSync({ bookingId, cleanerId, action: 'delete' });
};

export const trySyncBookingGoogleCalendar = async (bookingId: number, context: string) => {
  try {
    await syncBookingGoogleCalendar(bookingId);
    return null;
  } catch (error) {
    console.warn(`Google Calendar sync failed after ${context}:`, error);
    return error;
  }
};

export const tryDeleteBookingGoogleCalendar = async (
  bookingId: number,
  context: string,
  cleanerId?: number,
) => {
  try {
    await deleteBookingGoogleCalendar(bookingId, cleanerId);
    return null;
  } catch (error) {
    console.warn(`Google Calendar delete failed after ${context}:`, error);
    return error;
  }
};
