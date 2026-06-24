import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  DollarSign,
  Edit,
  FileText,
  MoreHorizontal,
  Repeat,
  Send,
  Tag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import type { Booking, BookingsListCardHandlers } from './types';

interface BookingsListActionsMenuProps {
  booking: Booking;
  handlers: BookingsListCardHandlers;
  triggerClassName?: string;
  iconClassName?: string;
}

export function BookingsListActionsMenu({
  booking,
  handlers,
  triggerClassName = 'h-8 w-8 p-0',
  iconClassName = 'h-4 w-4 text-muted-foreground',
}: BookingsListActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={triggerClassName}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className={iconClassName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
        <DropdownMenuItem onClick={() => handlers.onEdit(booking.id)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onDuplicate(booking)}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onAssignCleaner(booking.id)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Cleaner
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onMakeRecurring(booking)}>
          <Repeat className="w-4 h-4 mr-2" />
          Make Recurring
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onSendEmail(booking)}>
          <Send className="w-4 h-4 mr-2" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onViewInvoice(booking)}>
          <FileText className="w-4 h-4 mr-2" />
          View Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onSetSource(booking)}>
          <Tag className="w-4 h-4 mr-2" />
          Set Customer Source
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlers.onPaymentAction(booking)}>
          <DollarSign className="w-4 h-4 mr-2" />
          {booking.payment_method === 'Invoiless' ? 'Manage Invoice' : 'Manage Payment'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlers.onCancel(booking.id)} className="text-orange-600">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onDelete(booking.id)} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
