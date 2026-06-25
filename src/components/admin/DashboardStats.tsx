import React from 'react';
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/queries/useDashboardStats';
import { ShellStat, ShellStatGrid } from '@/layouts/shell';

interface DashboardStatsProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    cleanerId?: number;
    customerId?: number;
  };
}

const DashboardStats = ({ filters }: DashboardStatsProps) => {
  const { data: stats, isLoading } = useDashboardStats(filters);

  if (isLoading || !stats) {
    return (
      <ShellStatGrid>
        <ShellStat label="Total Bookings" value="—" icon={Calendar} loading />
        <ShellStat label="Monthly Revenue" value="—" icon={DollarSign} tone="success" loading />
        <ShellStat label="Unpaid Invoices" value="—" icon={AlertTriangle} tone="warning" loading />
      </ShellStatGrid>
    );
  }

  return (
    <ShellStatGrid>
      <ShellStat
        label="Total Bookings"
        value={stats.totalBookings}
        hint="Last 30 days"
        icon={Calendar}
        tone="brand"
      />
      <ShellStat
        label="Monthly Revenue"
        value={`£${(stats.monthlyRevenue || 0).toFixed(2)}`}
        hint="Last 30 days"
        icon={DollarSign}
        tone="success"
      />
      <ShellStat
        label="Unpaid Invoices"
        value={stats.unpaidInvoices}
        hint="Pending payment"
        icon={AlertTriangle}
        tone="warning"
      />
    </ShellStatGrid>
  );
};

export default DashboardStats;
