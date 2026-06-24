import { supabase } from '@/integrations/supabase/client';
import type { CustomerDetailData, CustomerDetailBooking } from './types';

export async function fetchCustomerDetailData(customerId: number): Promise<CustomerDetailData> {
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError) {
    throw customerError;
  }

  const { data: paymentMethodsData } = await supabase
    .from('customer_payment_methods')
    .select('*')
    .eq('customer_id', customerId);

  const { data: addressesData } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId);

  const { data: upcomingData } = await supabase
    .from('bookings')
    .select(`
      id, date_time, address, postcode, total_cost,
      cleaning_type, booking_status, payment_status,
      cleaners!inner(first_name, last_name)
    `)
    .eq('customer', customerId)
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true });

  const upcomingBookings: CustomerDetailBooking[] =
    upcomingData?.map((booking) => ({
      id: booking.id,
      date_time: booking.date_time,
      address: booking.address,
      postcode: booking.postcode,
      total_cost: booking.total_cost,
      cleaning_type: booking.cleaning_type,
      booking_status: booking.booking_status,
      payment_status: booking.payment_status,
      cleaner_name: booking.cleaners
        ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}`
        : 'Not assigned',
    })) || [];

  const { data: pastData } = await supabase
    .from('past_bookings')
    .select('*')
    .eq('customer', customerId)
    .order('date_time', { ascending: false })
    .limit(20);

  const pastBookings: CustomerDetailBooking[] = (pastData || []).map((booking) => ({
    id: booking.id,
    date_time: booking.date_time,
    address: booking.address,
    postcode: booking.postcode,
    total_cost: booking.total_cost,
    cleaning_type: booking.cleaning_type,
    booking_status: booking.booking_status || '',
    payment_status: booking.payment_status,
  }));

  const [pastBookingsResponse, linenOrdersResponse] = await Promise.all([
    supabase
      .from('past_bookings')
      .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
      .eq('customer', customerId)
      .or(
        'payment_status.ilike.%unpaid%,payment_status.ilike.%collecting%,payment_status.ilike.%outstanding%,payment_status.ilike.%pending%,payment_status.is.null',
      )
      .order('date_time', { ascending: false }),
    supabase
      .from('linen_orders')
      .select('id, order_date, total_cost, payment_status, address_id')
      .eq('customer_id', customerId)
      .neq('payment_status', 'paid')
      .order('order_date', { ascending: false }),
  ]);

  const pastBookingsUnpaid = pastBookingsResponse.data || [];
  const linenOrders = linenOrdersResponse.data || [];

  const addressIds = linenOrders.map((order) => order.address_id).filter(Boolean);
  let addressesLookup: Record<number, { address: string; postcode: string }> = {};

  if (addressIds.length > 0) {
    const { data: linenAddressesData } = await supabase
      .from('addresses')
      .select('id, address, postcode')
      .in('id', addressIds);

    addressesLookup = (linenAddressesData || []).reduce(
      (acc, addr) => {
        acc[addr.id] = addr;
        return acc;
      },
      {} as Record<number, { address: string; postcode: string }>,
    );
  }

  const unpaidBookings = [
    ...pastBookingsUnpaid.map((booking) => ({
      id: booking.id.toString(),
      date_time: booking.date_time,
      address: booking.address || 'No address',
      postcode: booking.postcode || '',
      total_cost: parseFloat(booking.total_cost?.toString() || '0'),
      cleaning_type: booking.cleaning_type || 'Cleaning Service',
      payment_status: booking.payment_status || 'unpaid',
      source: 'past_booking' as const,
    })),
    ...linenOrders.map((order) => {
      const address = order.address_id ? addressesLookup[order.address_id] : undefined;
      return {
        id: order.id,
        date_time: order.order_date,
        address: address?.address || 'Linen Order',
        postcode: address?.postcode || '',
        total_cost: parseFloat(order.total_cost?.toString() || '0'),
        cleaning_type: 'Linen Service',
        payment_status: order.payment_status || 'unpaid',
        source: 'linen_order' as const,
      };
    }),
  ];

  return {
    customer: customerData,
    paymentMethods: paymentMethodsData || [],
    addresses: addressesData || [],
    upcomingBookings,
    pastBookings,
    unpaidBookings,
  };
}
