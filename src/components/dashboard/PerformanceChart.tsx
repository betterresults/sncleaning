import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShellEmpty } from '@/layouts/shell';
import { PerformanceChartSkeleton } from './PerformanceChartSkeleton';
import { formatUK, getUKTodayDateString, shiftUKDateString } from '@/lib/ukTime';

interface ChartData {
  date: string;
  bookings: number;
  revenue: number;
}

const PerformanceChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      const from = `${shiftUKDateString(getUKTodayDateString(), -7)}T00:00:00+00:00`;

      const { data: bookingsData, error } = await supabase
        .from('past_bookings')
        .select('date_time, total_cost')
        .gte('date_time', from)
        .order('date_time', { ascending: true });

      if (error) throw error;

      const dataByDate: { [key: string]: { bookings: number; revenue: number } } = {};

      bookingsData?.forEach((booking) => {
        const date = formatUK(booking.date_time, 'MMM dd');
        if (!dataByDate[date]) {
          dataByDate[date] = { bookings: 0, revenue: 0 };
        }
        dataByDate[date].bookings += 1;
        dataByDate[date].revenue += Number(booking.total_cost) || 0;
      });

      const chartArray: ChartData[] = Object.entries(dataByDate).map(([date, data]) => ({
        date,
        bookings: data.bookings,
        revenue: Math.round(data.revenue),
      }));

      setChartData(chartArray);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartHeight = isMobile ? 240 : 280;

  if (loading) {
    return <PerformanceChartSkeleton height={chartHeight} />;
  }

  if (chartData.length === 0) {
    return (
      <ShellEmpty className="flex items-center justify-center" style={{ height: chartHeight }}>
        No data for the last 7 days
      </ShellEmpty>
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={
            isMobile
              ? { top: 8, right: 4, left: -18, bottom: 0 }
              : { top: 10, right: 10, left: 0, bottom: 0 }
          }
        >
          <defs>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007aff" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#007aff" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34c759" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#34c759" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(28,28,32,0.5)', fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
            stroke="transparent"
            axisLine={false}
            interval={isMobile ? 'preserveStartEnd' : 0}
            angle={isMobile ? -35 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 48 : 30}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'rgba(28,28,32,0.45)', fontSize: isMobile ? 10 : 12 }}
            stroke="transparent"
            axisLine={false}
            width={isMobile ? 28 : 40}
          />
          {!isMobile && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'rgba(28,28,32,0.45)', fontSize: 12 }}
              stroke="transparent"
              axisLine={false}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.96)',
              border: '0.5px solid rgba(0,0,0,0.08)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,40,100,0.1)',
              padding: '10px 12px',
              fontSize: '13px',
            }}
            cursor={{ fill: 'rgba(0, 122, 255, 0.06)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: isMobile ? 8 : 20, fontSize: isMobile ? 11 : 12 }}
            iconType="circle"
            iconSize={isMobile ? 8 : 10}
          />
          <Bar
            yAxisId="left"
            dataKey="bookings"
            fill="url(#colorBookings)"
            name="Bookings"
            radius={[6, 6, 0, 0]}
            maxBarSize={isMobile ? 28 : 40}
          />
          <Bar
            yAxisId={isMobile ? 'left' : 'right'}
            dataKey="revenue"
            fill="url(#colorRevenue)"
            name="Revenue (£)"
            radius={[6, 6, 0, 0]}
            maxBarSize={isMobile ? 28 : 40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
