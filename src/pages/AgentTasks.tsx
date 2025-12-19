import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { salesAgentNavigation } from '@/lib/navigationItems';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useAgentTasks, AgentTask } from '@/hooks/useAgentTasks';
import { TaskDetailsDialog } from '@/components/admin/TaskDetailsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, RefreshCw, CheckCircle, Clock, AlertCircle, Phone, User, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const AgentTasks = () => {
  usePageTracking('Agent Tasks');
  const { user, userRole, customerId, cleanerId, loading: authLoading, signOut } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const { tasks, loading, refetch, completeTask, updateTask } = useAgentTasks({
    assignedTo: user?.id,
    includeCompleted: statusFilter === 'all' || statusFilter === 'completed',
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleViewTask = (task: AgentTask) => {
    setSelectedTask(task);
    setDetailsDialogOpen(true);
  };

  const handleStartTask = async (task: AgentTask) => {
    await updateTask({ id: task.id, status: 'in_progress' });
  };

  const handleOpenCompleteDialog = (task: AgentTask) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setCompleteDialogOpen(true);
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    setCompleting(true);
    try {
      await completeTask(selectedTask.id, completionNotes || undefined);
      setCompleteDialogOpen(false);
      setSelectedTask(null);
    } finally {
      setCompleting(false);
    }
  };

  // Filter tasks based on status
  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return task.status === 'pending' || task.status === 'in_progress';
    return task.status === statusFilter;
  });

  // Sort: urgent/high priority first, then by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority] ?? 2;
    const bPriority = priorityOrder[b.priority] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const getCustomerName = (task: AgentTask) => {
    if (!task.customer) return null;
    if (task.customer.full_name) return task.customer.full_name;
    if (task.customer.first_name || task.customer.last_name) {
      return `${task.customer.first_name || ''} ${task.customer.last_name || ''}`.trim();
    }
    return task.customer.email || null;
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'sales_agent') {
    return <Navigate to="/auth" replace />;
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar 
            navigationItems={salesAgentNavigation}
            user={user}
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-2 sm:p-4 space-y-3 sm:space-y-4 w-full overflow-x-hidden">
              <div className="w-full px-1 sm:px-0 max-w-4xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-[#185166]">My Tasks</h1>
                  <p className="text-gray-600 mt-2">
                    {pendingCount > 0 || inProgressCount > 0 
                      ? `You have ${pendingCount} pending and ${inProgressCount} in-progress tasks`
                      : 'No active tasks assigned to you'
                    }
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active Tasks</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="all">All Tasks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">Loading tasks...</div>
                ) : sortedTasks.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                      <p>No tasks found. You're all caught up!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {sortedTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}
                        onClick={() => handleViewTask(task)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(task.status)}
                              <div>
                                <CardTitle className="text-lg">{task.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  <Badge variant="outline" className="mr-2">
                                    {getTaskTypeLabel(task.task_type)}
                                  </Badge>
                                  {task.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                  {task.priority === 'high' && (
                                    <Badge className="bg-orange-500">High Priority</Badge>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(task.due_date), 'dd MMM')}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                          )}
                          
                          {getCustomerName(task) && (
                            <div className="flex items-center gap-4 text-sm mb-3">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{getCustomerName(task)}</span>
                              </div>
                              {task.customer?.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={`tel:${task.customer.phone}`} 
                                    className="text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {task.customer.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {task.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStartTask(task)}
                              >
                                Start Task
                              </Button>
                            )}
                            {(task.status === 'pending' || task.status === 'in_progress') && (
                              <Button 
                                size="sm"
                                onClick={() => handleOpenCompleteDialog(task)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Mark this task as completed. You can add notes about what was done.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="notes">Completion Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g., Customer confirmed they were happy with the cleaning..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask} disabled={completing}>
              {completing ? 'Completing...' : 'Complete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AgentTasks;
