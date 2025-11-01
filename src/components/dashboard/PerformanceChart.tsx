import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

interface ChartData {
  date: string;
  bookings: number;
  revenue: number;
}

const PerformanceChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Get last 7 days data
      const last7Days = subDays(new Date(), 7);

      const { data: bookingsData, error } = await supabase
        .from('past_bookings')
        .select('date_time, total_cost')
        .gte('date_time', last7Days.toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Group by date
      const dataByDate: { [key: string]: { bookings: number; revenue: number } } = {};

      bookingsData?.forEach((booking) => {
        const date = format(new Date(booking.date_time), 'MMM dd');
        if (!dataByDate[date]) {
          dataByDate[date] = { bookings: 0, revenue: 0 };
        }
        dataByDate[date].bookings += 1;
        dataByDate[date].revenue += Number(booking.total_cost) || 0;
      });

      // Convert to array
      const chartArray: ChartData[] = Object.entries(dataByDate).map(([date, data]) => ({
        date,
        bookings: data.bookings,
        revenue: Math.round(data.revenue)
      }));

      setChartData(chartArray);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        <p>Няма данни за последните 7 дни</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.7}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            stroke="#e5e7eb"
            axisLine={false}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#e5e7eb"
            axisLine={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#e5e7eb"
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: '12px'
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            yAxisId="left"
            dataKey="bookings" 
            fill="url(#colorBookings)" 
            name="Bookings"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
          <Bar 
            yAxisId="right"
            dataKey="revenue" 
            fill="url(#colorRevenue)" 
            name="Revenue (£)"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
