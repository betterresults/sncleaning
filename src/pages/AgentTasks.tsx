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
import { AgentSMSPanel } from '@/components/agent/AgentSMSPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, RefreshCw, CheckCircle, Clock, AlertCircle, Phone, User, Calendar, MapPin, MessageSquare, Building2, StickyNote, Edit3 } from 'lucide-react';
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
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

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

  const handleOpenNotesDialog = (task: AgentTask) => {
    setSelectedTask(task);
    setEditingNotes(task.notes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedTask) return;
    setSavingNotes(true);
    try {
      await updateTask({ id: selectedTask.id, notes: editingNotes || null });
      setNotesDialogOpen(false);
      setSelectedTask(null);
    } finally {
      setSavingNotes(false);
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
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-primary';
      default:
        return 'border-l-muted';
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
                  <Card className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <p>No tasks found. You're all caught up!</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {sortedTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className={`border-l-4 overflow-hidden transition-all hover:shadow-lg ${getPriorityColor(task.priority)}`}
                      >
                        {/* Header Section */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => handleViewTask(task)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(task.status)}
                                <h3 className="font-semibold text-lg text-foreground truncate">{task.title}</h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {getTaskTypeLabel(task.task_type)}
                                </Badge>
                                {task.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                )}
                                {task.priority === 'high' && (
                                  <Badge className="bg-orange-500 text-xs">High Priority</Badge>
                                )}
                                {task.status === 'in_progress' && (
                                  <Badge className="bg-blue-500 text-xs">In Progress</Badge>
                                )}
                              </div>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center gap-1.5 text-sm bg-muted px-2 py-1 rounded-md shrink-0">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium">{format(new Date(task.due_date), 'dd MMM')}</span>
                              </div>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{task.description}</p>
                          )}
                        </div>

                        {/* Customer & Booking Info Section */}
                        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                          {/* Customer Row */}
                          {getCustomerName(task) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{getCustomerName(task)}</p>
                                  {task.customer?.email && (
                                    <p className="text-xs text-muted-foreground">{task.customer.email}</p>
                                  )}
                                </div>
                              </div>
                              {task.customer?.phone && (
                                <a 
                                  href={`tel:${task.customer.phone}`} 
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  {task.customer.phone}
                                </a>
                              )}
                            </div>
                          )}

                          {/* Booking Row */}
                          {task.booking && (
                            <div className="flex items-start gap-2 p-3 bg-background rounded-lg border">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">Booking #{task.booking.id}</span>
                                  {task.booking.service_type && (
                                    <Badge variant="outline" className="text-xs">{task.booking.service_type}</Badge>
                                  )}
                                  {task.booking.total_cost != null && (
                                    <Badge className="bg-emerald-500 text-xs">£{Number(task.booking.total_cost).toFixed(2)}</Badge>
                                  )}
                                  {task.booking.date_only && (
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(task.booking.date_only), 'EEE, dd MMM yyyy')}
                                    </span>
                                  )}
                                </div>
                                {task.booking.address && (
                                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{task.booking.address}</span>
                                    {task.booking.postcode && (
                                      <span className="shrink-0 font-medium">• {task.booking.postcode}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes Section */}
                        {task.notes && (
                          <div className="border-t bg-amber-50/50 px-4 py-3">
                            <div className="flex items-start gap-2">
                              <StickyNote className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-amber-700 mb-1">Agent Notes</p>
                                <p className="text-sm text-amber-900 whitespace-pre-wrap">{task.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions Section */}
                        <div className="border-t px-4 py-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {task.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStartTask(task)}
                            >
                              <Clock className="h-4 w-4 mr-1.5" />
                              Start Task
                            </Button>
                          )}
                          {(task.status === 'pending' || task.status === 'in_progress') && (
                            <>
                              <Button 
                                size="sm"
                                variant="default"
                                onClick={() => handleOpenCompleteDialog(task)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Mark Complete
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenNotesDialog(task)}
                              >
                                <Edit3 className="h-4 w-4 mr-1.5" />
                                {task.notes ? 'Edit Notes' : 'Add Notes'}
                              </Button>
                            </>
                          )}
                          
                          {/* SMS Button inline */}
                          {task.customer && (
                            <div className="ml-auto">
                              <AgentSMSPanel task={task} />
                            </div>
                          )}
                        </div>
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

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.notes ? 'Edit Notes' : 'Add Notes'}</DialogTitle>
            <DialogDescription>
              Add notes about this task. These will be visible to your admin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="e.g., Customer requested callback at 3pm, Left voicemail..."
              rows={5}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AgentTasks;
