import { supabase } from '@/integrations/supabase/client';
import { formatUK } from '@/lib/ukTime';

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export interface ExportBookingRow {
  id: number;
  date_time: string | null;
  time_only?: string | null;
  end_date_time?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  postcode?: string | null;
  service_type?: string | null;
  cleaning_type?: string | null;
  frequently?: string | null;
  total_hours?: number | null;
  total_cost?: number | null;
  cleaner_pay?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  booking_status?: string | null;
  extras?: string | null;
  additional_details?: string | null;
  primary_cleaner?: { full_name: string } | null;
}

const HEADERS = [
  'Booking ID', 'Date', 'Time', 'Customer', 'Email', 'Phone', 'Address', 'Postcode',
  'Service Type', 'Cleaning Type', 'Frequency', 'Hours', 'Cleaner',
  'Total Cost', 'Cleaner Pay', 'Payment Method', 'Payment Status', 'Booking Status',
  'Extras', 'Notes',
];

export function bookingsToCsv(bookings: ExportBookingRow[]): string {
  const rows = bookings.map((b) => [
    b.id,
    b.date_time ? formatUK(b.date_time, 'dd/MM/yyyy') : '',
    b.time_only || (b.date_time ? formatUK(b.date_time, 'HH:mm') : ''),
    `${b.first_name || ''} ${b.last_name || ''}`.trim(),
    b.email,
    b.phone_number,
    b.address,
    b.postcode,
    b.service_type,
    b.cleaning_type,
    b.frequently,
    b.total_hours,
    b.primary_cleaner?.full_name || '',
    b.total_cost,
    b.cleaner_pay,
    b.payment_method,
    b.payment_status,
    b.booking_status,
    b.extras,
    b.additional_details,
  ]);

  return [HEADERS, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Fetches every upcoming booking (paginated past the 1000-row limit) and returns CSV rows. */
export async function fetchAllUpcomingBookings(dateFrom: string, dateTo?: string) {
  const pageSize = 1000;
  let from = 0;
  const all: ExportBookingRow[] = [];

  while (true) {
    let query = supabase
      .from('bookings')
      .select('*')
      .gte('date_time', dateFrom)
      .order('date_time', { ascending: true })
      .range(from, from + pageSize - 1);

    if (dateTo) query = query.lte('date_time', dateTo);

    const { data, error } = await query;
    if (error) throw error;
    all.push(...((data || []) as unknown as ExportBookingRow[]));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  const ids = all.map((b) => b.id);
  if (ids.length > 0) {
    const cleanerMap: Record<number, string> = {};
    for (let i = 0; i < ids.length; i += 500) {
      const { data } = await supabase
        .from('cleaner_payments')
        .select('booking_id, cleaners ( full_name )')
        .in('booking_id', ids.slice(i, i + 500))
        .eq('is_primary', true);
      (data || []).forEach((row: any) => {
        if (row.cleaners?.full_name) cleanerMap[row.booking_id] = row.cleaners.full_name;
      });
    }
    all.forEach((b) => {
      if (cleanerMap[b.id]) b.primary_cleaner = { full_name: cleanerMap[b.id] };
    });
  }

  return all;
}
