import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { AgentTask } from '@/hooks/useAgentTasks';
import { format } from 'date-fns';

interface AgentTasksTableProps {
  tasks: AgentTask[];
  onViewTask: (task: AgentTask) => void;
  onDeleteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  showAssignedTo?: boolean;
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

export const AgentTasksTable: React.FC<AgentTasksTableProps> = ({
  tasks,
  onViewTask,
  onDeleteTask,
  onCancelTask,
  showAssignedTo = true,
}) => {
  const getDisplayName = (profile: { first_name: string | null; last_name: string | null; email: string | null } | null | undefined) => {
    if (!profile) return 'Unknown';
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email || 'Unknown';
  };

  const getCustomerName = (task: AgentTask) => {
    if (!task.customer) return '-';
    if (task.customer.full_name) return task.customer.full_name;
    if (task.customer.first_name || task.customer.last_name) {
      return `${task.customer.first_name || ''} ${task.customer.last_name || ''}`.trim();
    }
    return task.customer.email || '-';
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Type</TableHead>
            {showAssignedTo && <TableHead>Assigned To</TableHead>}
            <TableHead>Customer</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewTask(task)}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {task.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getTaskTypeLabel(task.task_type)}</TableCell>
              {showAssignedTo && (
                <TableCell>{getDisplayName(task.assigned_to_profile)}</TableCell>
              )}
              <TableCell>{getCustomerName(task)}</TableCell>
              <TableCell>{getPriorityBadge(task.priority)}</TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell>
                {task.due_date 
                  ? format(new Date(task.due_date), 'dd MMM yyyy')
                  : '-'
                }
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewTask(task); }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {task.status !== 'cancelled' && task.status !== 'completed' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCancelTask(task.id); }}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Task
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
