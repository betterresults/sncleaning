export interface BookingPeriodStats {
  totalBookings: number;
  monthlyRevenue: number;
  unpaidInvoices: number;
}

export interface DashboardStatsFilters {
  dateFrom?: string;
  dateTo?: string;
  cleanerId?: number;
  customerId?: number;
}

export interface QuickStatsData {
  upcomingBookings: number;
  activeCleaners: number;
  avgBookingValue: number;
  completionRate: number;
}
