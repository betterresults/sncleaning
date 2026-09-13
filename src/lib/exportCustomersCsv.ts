import { supabase } from '@/integrations/supabase/client';

const HEADERS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company_name',
  'address',
  'postcode',
  'source',
  'campaign',
  'service_address_name',
  'service_address',
  'service_postcode',
] as const;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

interface CustomerRow {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
}

interface AddressRow {
  customer_id: number;
  address: string | null;
  postcode: string | null;
  is_default: boolean | null;
}

interface LeadRow {
  email: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  source: string | null;
}

interface BookingAddressRow {
  customer: number;
  address: string | null;
  postcode: string | null;
}

async function fetchAllCustomers(): Promise<CustomerRow[]> {
  const pageSize = 1000;
  let from = 0;
  const all: CustomerRow[] = [];
  while (true) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, company, source')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...((data || []) as CustomerRow[]));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function fetchAllAddresses(): Promise<AddressRow[]> {
  const pageSize = 1000;
  let from = 0;
  const all: AddressRow[] = [];
  while (true) {
    const { data, error } = await supabase
      .from('addresses')
      .select('customer_id, address, postcode, is_default')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...((data || []) as AddressRow[]));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function fetchLeadsForCampaign(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('quote_leads')
    .select('email, utm_campaign, utm_source, source')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as LeadRow[];
}

async function fetchRecentBookingAddresses(): Promise<Map<number, BookingAddressRow>> {
  const map = new Map<number, BookingAddressRow>();
  const { data, error } = await supabase
    .from('bookings')
    .select('customer, address, postcode')
    .order('date_time', { ascending: false })
    .limit(2000);
  if (error) throw error;
  for (const row of (data || []) as BookingAddressRow[]) {
    if (row.customer && !map.has(row.customer)) {
      map.set(row.customer, row);
    }
  }
  return map;
}

export async function downloadAllCustomersCsv(): Promise<void> {
  const [customers, addresses, leads, bookingAddressMap] = await Promise.all([
    fetchAllCustomers(),
    fetchAllAddresses(),
    fetchLeadsForCampaign(),
    fetchRecentBookingAddresses(),
  ]);

  // Default address per customer (prefer is_default, otherwise first)
  const defaultAddressMap = new Map<number, AddressRow>();
  for (const addr of addresses) {
    if (!addr.customer_id) continue;
    if (addr.is_default || !defaultAddressMap.has(addr.customer_id)) {
      defaultAddressMap.set(addr.customer_id, addr);
    }
  }

  // Campaign per email (most recent lead wins)
  const campaignMap = new Map<string, string>();
  for (const lead of leads) {
    if (!lead.email) continue;
    const key = lead.email.toLowerCase();
    if (!campaignMap.has(key)) {
      campaignMap.set(
        key,
        lead.utm_campaign || lead.utm_source || lead.source || '',
      );
    }
  }

  const rows = customers.map((c) => {
    const defaultAddr = defaultAddressMap.get(c.id);
    const bookingAddr = bookingAddressMap.get(c.id);
    const campaign = campaignMap.get((c.email || '').toLowerCase()) || '';

    return {
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      email: c.email || '',
      phone: c.phone || '',
      company_name: c.company || '',
      address: defaultAddr?.address || '',
      postcode: defaultAddr?.postcode || '',
      source: c.source || '',
      campaign,
      service_address_name: '',
      service_address: bookingAddr?.address || defaultAddr?.address || '',
      service_postcode: bookingAddr?.postcode || defaultAddr?.postcode || '',
    };
  });

  const csv = [
    HEADERS.join(','),
    ...rows.map((r) => HEADERS.map((h) => escapeCell(r[h])).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
