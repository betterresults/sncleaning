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
import { Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubCleaner {
  cleaner_id: number;
  cleaner_pay: number;
  hours_assigned: number;
  cleaner_name?: string;
}

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
  cleaner_name?: string;
  customer: number;
  sub_cleaners?: SubCleaner[];
  total_cleaner_pay?: number;
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
        No past bookings found for the selected date range.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cleaners</TableHead>
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
              const totalCleanerCost = booking.total_cleaner_pay || booking.cleaner_pay || 0;
              const profit = revenue - totalCleanerCost;
              const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

              const customerName = `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'N/A';
              const primaryCleanerName = booking.cleaner_name || (booking.cleaner ? `Cleaner ${booking.cleaner}` : 'Unassigned');
              const hasSubCleaners = booking.sub_cleaners && booking.sub_cleaners.length > 0;

              return (
                <TableRow key={booking.id}>
                  <TableCell>
                    {format(new Date(booking.date_time), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{primaryCleanerName}</span>
                      {hasSubCleaners && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
                              <Users className="h-3 w-3" />
                              +{booking.sub_cleaners!.length}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">Additional Cleaners:</p>
                              {booking.sub_cleaners!.map((sc, idx) => (
                                <p key={idx} className="text-sm">
                                  {sc.cleaner_name}: £{sc.cleaner_pay?.toFixed(2) || '0.00'}
                                </p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {booking.address}, {booking.postcode}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    £{revenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">£{totalCleanerCost.toFixed(2)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="text-sm">Primary: £{(booking.cleaner_pay || 0).toFixed(2)}</p>
                          {hasSubCleaners && booking.sub_cleaners!.map((sc, idx) => (
                            <p key={idx} className="text-sm">
                              {sc.cleaner_name}: £{sc.cleaner_pay?.toFixed(2) || '0.00'}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
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
    </TooltipProvider>
  );
};
