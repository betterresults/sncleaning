import type { BookingsListParams, PastBookingsListParams, UpcomingCalendarParams } from '@/api/bookings/types';
import type { DashboardStatsFilters } from '@/api/dashboard/types';
import type { UserListType } from '@/api/users/types';

export const queryKeys = {
  bookings: {
    all: ['bookings'] as const,
    list: (params: BookingsListParams) => ['bookings', 'list', params] as const,
  },
  pastBookings: {
    all: ['past-bookings'] as const,
    list: (params: PastBookingsListParams) => ['past-bookings', 'list', params] as const,
  },
  cleaners: {
    all: ['cleaners'] as const,
    list: ['cleaners', 'list'] as const,
    options: ['cleaners', 'options'] as const,
  },
  customers: {
    all: ['customers'] as const,
    sources: ['customers', 'sources'] as const,
    paymentMethods: (customerIds: number[]) =>
      ['customers', 'payment-methods', [...customerIds].sort((a, b) => a - b)] as const,
    paymentMethodsList: (customerId: number | null | undefined) =>
      ['customers', 'payment-methods-list', customerId] as const,
    isBusinessClient: (customerId: number | null | undefined) =>
      ['customers', 'is-business', customerId] as const,
    overdueInvoices: (customerId: number | null | undefined) =>
      ['customers', 'overdue-invoices', customerId] as const,
    upcomingBookings: (customerId: number | null | undefined) =>
      ['customers', 'upcoming-bookings', customerId] as const,
    detail: (customerId: number | null | undefined) =>
      ['customers', 'detail', customerId] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    quickStats: ['dashboard', 'quick-stats'] as const,
    stats: (filters?: DashboardStatsFilters) => ['dashboard', 'stats', filters] as const,
    pastBookingsMonthly: (month: string) =>
      ['dashboard', 'past-bookings-monthly', month] as const,
  },
  users: {
    all: ['users'] as const,
    list: (userType: UserListType) => ['users', 'list', userType] as const,
  },
  upcomingCalendar: {
    all: ['upcoming-calendar'] as const,
    data: (params: UpcomingCalendarParams) => ['upcoming-calendar', 'data', params] as const,
  },
};
