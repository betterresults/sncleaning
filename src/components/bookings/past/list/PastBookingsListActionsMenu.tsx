import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Camera,
  Copy,
  DollarSign,
  Edit,
  MoreHorizontal,
  Repeat,
  Send,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { PastBooking, PastBookingsListCardHandlers } from './types';

interface PastBookingsListActionsMenuProps {
  booking: PastBooking;
  handlers: PastBookingsListCardHandlers;
  triggerClassName?: string;
  iconClassName?: string;
}

export function PastBookingsListActionsMenu({
  booking,
  handlers,
  triggerClassName = 'h-8 w-8 p-0 hover:bg-accent',
  iconClassName = 'h-4 w-4 text-muted-foreground',
}: PastBookingsListActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" className={triggerClassName}>
          <MoreHorizontal className={iconClassName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onEdit(booking.id); }}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onDuplicate(booking); }}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onPhotoManagement(booking); }}>
          <Camera className="w-4 h-4 mr-2" />
          {booking.has_photos ? 'View/Manage Photos' : 'Upload Photos'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onAssignCleaner(booking.id); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Cleaner
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onMakeRecurring(booking); }}>
          <Repeat className="w-4 h-4 mr-2" />
          Make Recurring
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onSendEmail(booking); }}>
          <Send className="w-4 h-4 mr-2" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handlers.onPaymentAction(booking); }}>
          <DollarSign className="w-4 h-4 mr-2" />
          {booking.payment_method === 'Invoiless' ? 'Manage Invoice' : 'Manage Payment'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => { e.preventDefault(); handlers.onDelete(booking.id); }}
          className="text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
