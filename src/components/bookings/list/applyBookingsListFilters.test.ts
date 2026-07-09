import { describe, expect, it } from 'vitest';
import { applyBookingsListFilters } from '@/components/bookings/list/applyBookingsListFilters';
import { defaultBookingsListFilters } from '@/components/bookings/list/types';
import type { BookingListItem } from '@/api/bookings';

const makeBooking = (overrides: Partial<BookingListItem> = {}): BookingListItem =>
  ({
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone_number: '07123456789',
    address: '1 High Street',
    postcode: 'N1 1AA',
    date_time: '2026-07-10T09:00:00+00:00',
    cleaner: 5,
    payment_method: 'card',
    payment_status: 'paid',
    service_type: 'domestic',
    cleaning_type: 'standard',
    booking_status: 'confirmed',
    customer: 100,
    ...overrides,
  }) as BookingListItem;

const bookings = [
  makeBooking({ id: 1, cleaner: 5, email: 'jane@example.com', customer: 100 }),
  makeBooking({
    id: 2,
    cleaner: null,
    first_name: 'Bob',
    last_name: 'Smith',
    email: 'bob@example.com',
    customer: 200,
    date_time: '2026-07-12T14:00:00+00:00',
  }),
  makeBooking({
    id: 3,
    cleaner: 8,
    first_name: 'Alice',
    last_name: 'Brown',
    email: 'alice@example.com',
    customer: 300,
    service_type: 'airbnb',
  }),
];

const sourceMap = { 100: 'google', 200: 'referral', 300: 'google' };

describe('applyBookingsListFilters', () => {
  it('returns all bookings with default filters', () => {
    expect(applyBookingsListFilters(bookings, defaultBookingsListFilters, sourceMap)).toHaveLength(3);
  });

  it('filters by cleaner id', () => {
    const result = applyBookingsListFilters(
      bookings,
      { ...defaultBookingsListFilters, cleanerId: '8' },
      sourceMap
    );
    expect(result.map((b) => b.id)).toEqual([3]);
  });

  it('filters unassigned bookings', () => {
    const result = applyBookingsListFilters(
      bookings,
      { ...defaultBookingsListFilters, cleanerId: 'unassigned' },
      sourceMap
    );
    expect(result.map((b) => b.id)).toEqual([2]);
  });

  it('filters by search term across name and email', () => {
    const result = applyBookingsListFilters(
      bookings,
      { ...defaultBookingsListFilters, searchTerm: 'bob' },
      sourceMap
    );
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('bob@example.com');
  });

  it('filters by customer source', () => {
    const result = applyBookingsListFilters(
      bookings,
      { ...defaultBookingsListFilters, customerSource: 'google' },
      sourceMap
    );
    expect(result.map((b) => b.id)).toEqual([1, 3]);
  });

  it('combines cleaner and service type filters', () => {
    const result = applyBookingsListFilters(
      bookings,
      {
        ...defaultBookingsListFilters,
        cleanerId: '8',
        serviceType: 'airbnb',
      },
      sourceMap
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });
});
