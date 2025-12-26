import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BookingCleaner {
  id: string;
  booking_id: number;
  cleaner_id: number;
  is_primary: boolean;
  payment_type: 'hourly' | 'percentage' | 'fixed';
  hourly_rate: number | null;
  percentage_rate: number | null;
  fixed_amount: number | null;
  hours_assigned: number | null;
  calculated_pay: number;
  status: string;
  cleaner?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    hourly_rate: number;
    presentage_rate: number;
  };
}

export interface AddBookingCleanerParams {
  bookingId: number;
  cleanerId: number;
  isPrimary: boolean;
  paymentType: 'hourly' | 'percentage' | 'fixed';
  hourlyRate?: number;
  percentageRate?: number;
  fixedAmount?: number;
  hoursAssigned?: number;
  totalCost: number;
  totalHours?: number;
}

export interface UpdateBookingCleanerParams {
  id: string;
  paymentType?: 'hourly' | 'percentage' | 'fixed';
  hourlyRate?: number;
  percentageRate?: number;
  fixedAmount?: number;
  hoursAssigned?: number;
  totalCost: number;
}

// Calculate pay based on payment type
export const calculateCleanerPay = (
  paymentType: 'hourly' | 'percentage' | 'fixed',
  totalCost: number,
  hourlyRate?: number,
  percentageRate?: number,
  fixedAmount?: number,
  hoursAssigned?: number
): number => {
  switch (paymentType) {
    case 'hourly':
      return (hoursAssigned || 0) * (hourlyRate || 0);
    case 'percentage':
      return (totalCost * (percentageRate || 0)) / 100;
    case 'fixed':
      return fixedAmount || 0;
    default:
      return 0;
  }
};

// Fetch all cleaners for a booking
export const fetchBookingCleaners = async (bookingId: number): Promise<BookingCleaner[]> => {
  const { data, error } = await supabase
    .from('cleaner_payments')
    .select(`
      *,
      cleaner:cleaners (
        id,
        first_name,
        last_name,
        full_name,
        email,
        hourly_rate,
        presentage_rate
      )
    `)
    .eq('booking_id', bookingId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching booking cleaners:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    payment_type: item.payment_type as 'hourly' | 'percentage' | 'fixed'
  }));
};

// Fetch additional cleaners only (is_primary = false)
export const fetchAdditionalCleaners = async (bookingId: number): Promise<BookingCleaner[]> => {
  const { data, error } = await supabase
    .from('cleaner_payments')
    .select(`
      *,
      cleaner:cleaners (
        id,
        first_name,
        last_name,
        full_name,
        email,
        hourly_rate,
        presentage_rate
      )
    `)
    .eq('booking_id', bookingId)
    .eq('is_primary', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching additional cleaners:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    payment_type: item.payment_type as 'hourly' | 'percentage' | 'fixed'
  }));
};

// Add a cleaner to a booking
export const addBookingCleaner = async (params: AddBookingCleanerParams): Promise<BookingCleaner> => {
  const calculatedPay = calculateCleanerPay(
    params.paymentType,
    params.totalCost,
    params.hourlyRate,
    params.percentageRate,
    params.fixedAmount,
    params.hoursAssigned
  );

  const { data, error } = await supabase
    .from('cleaner_payments')
    .insert({
      booking_id: params.bookingId,
      cleaner_id: params.cleanerId,
      is_primary: params.isPrimary,
      payment_type: params.paymentType,
      hourly_rate: params.paymentType === 'hourly' ? params.hourlyRate : null,
      percentage_rate: params.paymentType === 'percentage' ? params.percentageRate : null,
      fixed_amount: params.paymentType === 'fixed' ? params.fixedAmount : null,
      hours_assigned: params.hoursAssigned || null,
      calculated_pay: calculatedPay,
      status: 'assigned'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding booking cleaner:', error);
    throw error;
  }

  return {
    ...data,
    payment_type: data.payment_type as 'hourly' | 'percentage' | 'fixed'
  };
};

// Update a booking cleaner
export const updateBookingCleaner = async (params: UpdateBookingCleanerParams): Promise<void> => {
  const updateData: any = {};
  
  if (params.paymentType) {
    updateData.payment_type = params.paymentType;
    updateData.hourly_rate = params.paymentType === 'hourly' ? params.hourlyRate : null;
    updateData.percentage_rate = params.paymentType === 'percentage' ? params.percentageRate : null;
    updateData.fixed_amount = params.paymentType === 'fixed' ? params.fixedAmount : null;
  }
  
  if (params.hoursAssigned !== undefined) {
    updateData.hours_assigned = params.hoursAssigned;
  }
  
  // Calculate pay
  const paymentType = params.paymentType || 'hourly';
  updateData.calculated_pay = calculateCleanerPay(
    paymentType,
    params.totalCost,
    params.hourlyRate,
    params.percentageRate,
    params.fixedAmount,
    params.hoursAssigned
  );

  const { error } = await supabase
    .from('cleaner_payments')
    .update(updateData)
    .eq('id', params.id);

  if (error) {
    console.error('Error updating booking cleaner:', error);
    throw error;
  }
};

// Remove a cleaner from a booking
export const removeBookingCleaner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('cleaner_payments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing booking cleaner:', error);
    throw error;
  }
};

// Update or create primary cleaner for a booking
export const upsertPrimaryCleaner = async (
  bookingId: number,
  cleanerId: number,
  paymentType: 'hourly' | 'percentage' | 'fixed',
  totalCost: number,
  hourlyRate?: number,
  percentageRate?: number,
  fixedAmount?: number,
  hoursAssigned?: number
): Promise<void> => {
  // Check if primary cleaner already exists
  const { data: existing } = await supabase
    .from('cleaner_payments')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('is_primary', true)
    .single();

  const calculatedPay = calculateCleanerPay(
    paymentType,
    totalCost,
    hourlyRate,
    percentageRate,
    fixedAmount,
    hoursAssigned
  );

  if (existing) {
    // Update existing primary cleaner
    const { error } = await supabase
      .from('cleaner_payments')
      .update({
        cleaner_id: cleanerId,
        payment_type: paymentType,
        hourly_rate: paymentType === 'hourly' ? hourlyRate : null,
        percentage_rate: paymentType === 'percentage' ? percentageRate : null,
        fixed_amount: paymentType === 'fixed' ? fixedAmount : null,
        hours_assigned: hoursAssigned,
        calculated_pay: calculatedPay
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Insert new primary cleaner
    const { error } = await supabase
      .from('cleaner_payments')
      .insert({
        booking_id: bookingId,
        cleaner_id: cleanerId,
        is_primary: true,
        payment_type: paymentType,
        hourly_rate: paymentType === 'hourly' ? hourlyRate : null,
        percentage_rate: paymentType === 'percentage' ? percentageRate : null,
        fixed_amount: paymentType === 'fixed' ? fixedAmount : null,
        hours_assigned: hoursAssigned,
        calculated_pay: calculatedPay,
        status: 'assigned'
      });

    if (error) throw error;
  }
};

// Get total pay for additional cleaners
export const getTotalAdditionalCleanersPay = async (bookingId: number): Promise<number> => {
  const { data, error } = await supabase
    .from('cleaner_payments')
    .select('calculated_pay')
    .eq('booking_id', bookingId)
    .eq('is_primary', false);

  if (error) {
    console.error('Error fetching additional cleaners pay:', error);
    return 0;
  }

  return (data || []).reduce((sum, c) => sum + (c.calculated_pay || 0), 0);
};

// Get total hours assigned to additional cleaners
export const getTotalAdditionalCleanersHours = async (bookingId: number): Promise<number> => {
  const { data, error } = await supabase
    .from('cleaner_payments')
    .select('hours_assigned')
    .eq('booking_id', bookingId)
    .eq('is_primary', false);

  if (error) {
    console.error('Error fetching additional cleaners hours:', error);
    return 0;
  }

  return (data || []).reduce((sum, c) => sum + (c.hours_assigned || 0), 0);
};

// Update primary cleaner pay based on additional cleaners
export const recalculatePrimaryCleanerPay = async (
  bookingId: number,
  newAdditionalCleanerHours: number = 0
): Promise<void> => {
  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('cleaner, cleaner_rate, cleaner_percentage, total_cost, total_hours, cleaning_time')
    .eq('id', bookingId)
    .single();
  
  if (bookingError || !booking || !booking.cleaner) return;
  
  // Get total additional cleaner hours
  const { data: additionalCleaners } = await supabase
    .from('cleaner_payments')
    .select('hours_assigned')
    .eq('booking_id', bookingId)
    .eq('is_primary', false);
  
  const existingAdditionalHours = (additionalCleaners || []).reduce(
    (sum, c) => sum + (c.hours_assigned || 0), 0
  );
  
  const totalHours = booking.total_hours || booking.cleaning_time || 0;
  const totalAdditionalHours = existingAdditionalHours + newAdditionalCleanerHours;
  const primaryCleanerHours = Math.max(0, totalHours - totalAdditionalHours);
  
  let newPrimaryCleanerPay: number;
  
  if (booking.cleaner_rate && booking.cleaner_rate > 0) {
    newPrimaryCleanerPay = primaryCleanerHours * booking.cleaner_rate;
  } else if (booking.cleaner_percentage && booking.cleaner_percentage > 0) {
    const hoursRatio = totalHours > 0 ? primaryCleanerHours / totalHours : 0;
    newPrimaryCleanerPay = (booking.total_cost || 0) * (booking.cleaner_percentage / 100) * hoursRatio;
  } else {
    newPrimaryCleanerPay = primaryCleanerHours * 20; // Default £20/hour
  }
  
  // Update the booking with new cleaner_pay
  await supabase
    .from('bookings')
    .update({ cleaner_pay: newPrimaryCleanerPay })
    .eq('id', bookingId);
  
  // Also update cleaner_payments if primary exists there
  const { data: primaryCleaner } = await supabase
    .from('cleaner_payments')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('is_primary', true)
    .single();
  
  if (primaryCleaner) {
    await supabase
      .from('cleaner_payments')
      .update({ 
        calculated_pay: newPrimaryCleanerPay,
        hours_assigned: primaryCleanerHours 
      })
      .eq('id', primaryCleaner.id);
  }
};

// Fetch bookings for a cleaner (both primary and additional)
export const fetchCleanerBookings = async (
  cleanerId: number,
  futureOnly: boolean = true
): Promise<{ primary: number[]; additional: { bookingId: number; pay: number; hours: number }[] }> => {
  // Get bookings where cleaner is additional
  const { data: additionalData } = await supabase
    .from('cleaner_payments')
    .select('booking_id, calculated_pay, hours_assigned')
    .eq('cleaner_id', cleanerId)
    .eq('is_primary', false);

  const additional = (additionalData || []).map(d => ({
    bookingId: d.booking_id,
    pay: d.calculated_pay || 0,
    hours: d.hours_assigned || 0
  }));

  // Primary bookings are still stored in bookings.cleaner
  // This maintains backward compatibility
  return { primary: [], additional };
};
