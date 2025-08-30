
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface CompletedBooking {
  id: number;
  date_time: string;
  total_cost: string;
  cleaner_pay: number;
  first_name: string;
  last_name: string;
  address: string;
  postcode: string;
  cleaner: number;
  cleaners: {
    first_name: string;
    last_name: string;
  } | null;
  customers: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ProfitTrackingTableProps {
  bookings: CompletedBooking[];
  isLoading: boolean;
}

export const ProfitTrackingTable = ({
  bookings,
  isLoading
}: ProfitTrackingTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No completed bookings found for the selected date range.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Cleaner</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Cleaner Cost</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Margin %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const revenue = parseFloat(booking.total_cost) || 0;
            const cleanerCost = booking.cleaner_pay || 0;
            const profit = revenue - cleanerCost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            const customerName = booking.customers 
              ? `${booking.customers.first_name} ${booking.customers.last_name}`
              : `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'N/A';

            const cleanerName = booking.cleaners 
              ? `${booking.cleaners.first_name} ${booking.cleaners.last_name}`
              : 'Unassigned';

            return (
              <TableRow key={booking.id}>
                <TableCell>
                  {format(new Date(booking.date_time), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>{customerName}</TableCell>
                <TableCell>{cleanerName}</TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {booking.address}, {booking.postcode}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  £{revenue.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  £{cleanerCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={profit >= 0 ? "default" : "destructive"}>
                    £{profit.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={margin >= 30 ? "default" : margin >= 15 ? "secondary" : "destructive"}
                  >
                    {margin.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};