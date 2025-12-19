import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AgentTask } from '@/hooks/useAgentTasks';
import { format } from 'date-fns';
import { User, Calendar, Clock, FileText, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

interface TaskDetailsDialogProps {
  task: AgentTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
    case 'completed':
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <Badge variant="destructive">Urgent</Badge>;
    case 'high':
      return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
    case 'medium':
      return <Badge variant="secondary">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getTaskTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    follow_up: 'Follow Up',
    call_customer: 'Call Customer',
    check_service: 'Check Service',
    collect_feedback: 'Collect Feedback',
    other: 'Other',
  };
  return labels[type] || type;
};

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  if (!task) return null;

  const getDisplayName = (profile: { first_name: string | null; last_name: string | null; email: string | null } | null | undefined) => {
    if (!profile) return 'Unknown';
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email || 'Unknown';
  };

  const getCustomerName = () => {
    if (!task.customer) return null;
    if (task.customer.full_name) return task.customer.full_name;
    if (task.customer.first_name || task.customer.last_name) {
      return `${task.customer.first_name || ''} ${task.customer.last_name || ''}`.trim();
    }
    return task.customer.email || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Details
          </DialogTitle>
          <DialogDescription>
            View task information and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-lg font-semibold">{task.title}</h3>
            <div className="flex gap-2 mt-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
              <Badge variant="outline">{getTaskTypeLabel(task.task_type)}</Badge>
            </div>
          </div>

          {task.description && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Assigned To
              </div>
              <p className="font-medium">{getDisplayName(task.assigned_to_profile)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Assigned By
              </div>
              <p className="font-medium">{getDisplayName(task.assigned_by_profile)}</p>
            </div>
          </div>

          {getCustomerName() && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Customer
              </div>
              <p className="font-medium">{getCustomerName()}</p>
              {task.customer?.phone && (
                <p className="text-sm text-muted-foreground">{task.customer.phone}</p>
              )}
              {task.customer?.email && (
                <p className="text-sm text-muted-foreground">{task.customer.email}</p>
              )}
            </div>
          )}

          {task.booking && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Related Booking
              </div>
              <p className="font-medium">
                Booking #{task.booking.id} - {task.booking.service_type || 'Cleaning'}
              </p>
              {task.booking.date_only && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(task.booking.date_only), 'dd MMM yyyy')}
                </p>
              )}
              {task.booking.address && (
                <p className="text-sm text-muted-foreground">
                  {task.booking.address}, {task.booking.postcode}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {task.due_date && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Due Date
                </div>
                <p className="font-medium">
                  {format(new Date(task.due_date), 'dd MMM yyyy')}
                </p>
              </div>
            )}

            {task.completed_at && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </div>
                <p className="font-medium">
                  {format(new Date(task.completed_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>

          {task.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Notes
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Created: {format(new Date(task.created_at), 'dd MMM yyyy HH:mm')}</p>
            <p>Updated: {format(new Date(task.updated_at), 'dd MMM yyyy HH:mm')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
