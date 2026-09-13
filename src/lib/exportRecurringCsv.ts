import { supabase } from '@/integrations/supabase/client';
import { formatUK } from '@/lib/ukTime';

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const HEADERS = [
  'customer_email',
  'service_address_name',
  'service_address',
  'service_postcode',
  'frequency',
  'start_date',
  'preferred_days',
  'preferred_time',
  'pricing_type',
  'hours',
  'cleaning_cost_per_hour',
  'fixed_price',
  'total_cost',
  'cleaner_email',
  'cleaning_type',
  'extras',
  'end_date',
  'series_ref',
];

/** Recurring `start_time` is stored as HH:mm, HH:mm:ss, or HH:mm:ss+00 — never parse via Date. */
function formatStartTime(startTime?: string | null): string {
  if (!startTime) return '';
  const match = String(startTime).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export interface RecurringExportRow {
  customer_email: string | null;
  service_address: string | null;
  service_postcode: string | null;
  frequently: string | null;
  start_date: string | null;
  days_of_the_week: string | null;
  start_time: string | null;
  hours: string | null;
  cost_per_hour: number | null;
  total_cost: number | null;
  cleaner_email: string | null;
  cleaning_type: string | null;
  recurring_group_id: string | null;
  was_created_until: string | null;
}

export function recurringToCsv(rows: RecurringExportRow[]): string {
  const data = rows.map((r) => {
    const perHour = r.cost_per_hour ? Number(r.cost_per_hour) : null;
    const isHourly = !!perHour && perHour > 0;
    return [
      r.customer_email || '',
      '', // service_address_name — not tracked
      r.service_address || '',
      r.service_postcode || '',
      r.frequently || '',
      r.start_date ? formatUK(r.start_date, 'yyyy-MM-dd') : '',
      r.days_of_the_week || '',
      formatStartTime(r.start_time),
      isHourly ? 'hourly' : 'fixed',
      r.hours ?? '',
      isHourly ? perHour : '',
      isHourly ? '' : (r.total_cost ?? ''),
      r.total_cost ?? '',
      r.cleaner_email || '',
      r.cleaning_type || '',
      '', // extras — not tracked on recurring_services
      r.was_created_until ? formatUK(r.was_created_until, 'yyyy-MM-dd') : '',
      r.recurring_group_id || '',
    ];
  });

  return [HEADERS, ...data].map((row) => row.map(escapeCell).join(',')).join('\r\n');
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

/** Fetches every recurring service (paginated past the 1000-row limit) and resolves emails/addresses. */
export async function fetchAllRecurringForExport(): Promise<RecurringExportRow[]> {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('recurring_services')
      .select('*')
      .order('start_date', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  const customerIds = [...new Set(all.map((s) => s.customer).filter(Boolean))];
  const cleanerIds = [...new Set(all.map((s) => s.cleaner).filter(Boolean))];
  const addressIds = [...new Set(all.map((s) => s.address).filter(Boolean))];

  const customerMap: Record<number, string> = {};
  for (let i = 0; i < customerIds.length; i += 500) {
    const { data } = await supabase
      .from('customers')
      .select('id, email')
      .in('id', customerIds.slice(i, i + 500));
    (data || []).forEach((c: any) => {
      if (c.email) customerMap[c.id] = c.email;
    });
  }

  const cleanerMap: Record<number, string> = {};
  for (let i = 0; i < cleanerIds.length; i += 500) {
    const { data } = await supabase
      .from('cleaners')
      .select('id, email')
      .in('id', cleanerIds.slice(i, i + 500));
    (data || []).forEach((c: any) => {
      if (c.email) cleanerMap[c.id] = c.email;
    });
  }

  const addressMap: Record<string, { address: string; postcode: string }> = {};
  for (let i = 0; i < addressIds.length; i += 500) {
    const { data } = await supabase
      .from('addresses')
      .select('id, address, postcode')
      .in('id', addressIds.slice(i, i + 500));
    (data || []).forEach((a: any) => {
      addressMap[a.id] = { address: a.address || '', postcode: a.postcode || '' };
    });
  }

  return all.map((s) => ({
    customer_email: customerMap[s.customer] || null,
    service_address: s.address ? addressMap[s.address]?.address || null : null,
    service_postcode: s.address ? addressMap[s.address]?.postcode || null : null,
    frequently: s.frequently || null,
    start_date: s.start_date || null,
    days_of_the_week: s.days_of_the_week || null,
    start_time: s.start_time || null,
    hours: s.hours ?? null,
    cost_per_hour: s.cost_per_hour ?? null,
    total_cost: s.total_cost ?? null,
    cleaner_email: s.cleaner ? cleanerMap[s.cleaner] || null : null,
    cleaning_type: s.cleaning_type || null,
    recurring_group_id: s.recurring_group_id || null,
    was_created_until: s.was_created_until || null,
  }));
}
