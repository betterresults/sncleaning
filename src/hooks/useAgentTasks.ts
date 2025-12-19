import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AgentTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  assigned_to: string;
  assigned_by: string;
  customer_id: number | null;
  booking_id: number | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: {
    id: number;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  booking?: {
    id: number;
    date_only: string | null;
    address: string | null;
    postcode: string | null;
    service_type: string | null;
  } | null;
  assigned_to_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  assigned_by_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  task_type: string;
  assigned_to: string;
  customer_id?: number | null;
  booking_id?: number | null;
  priority?: string;
  due_date?: string | null;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  task_type?: string;
  assigned_to?: string;
  customer_id?: number | null;
  booking_id?: number | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  notes?: string | null;
  completed_at?: string | null;
}

export const useAgentTasks = (options?: { 
  assignedTo?: string; 
  status?: string;
  includeCompleted?: boolean;
}) => {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTasks = async () => {
    console.log('fetchTasks called with options:', options);
    
    // Skip fetch if assignedTo is expected but user hasn't loaded yet
    if ('assignedTo' in (options || {}) && !options?.assignedTo) {
      console.log('Skipping fetch - assignedTo not ready');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('agent_tasks')
        .select(`
          *,
          customer:customers(id, full_name, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (options?.assignedTo) {
        console.log('Filtering by assignedTo:', options.assignedTo);
        query = query.eq('assigned_to', options.assignedTo);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      } else if (!options?.includeCompleted) {
        query = query.in('status', ['pending', 'in_progress']);
      }

      const { data, error: fetchError } = await query;
      
      console.log('Fetch result:', { data, error: fetchError });

      if (fetchError) throw fetchError;

      const tasks = data as AgentTask[];
      
      // Get unique user IDs for profiles
      const userIds = [...new Set([
        ...tasks.map(t => t.assigned_to),
        ...tasks.map(t => t.assigned_by)
      ])];

      // Get unique booking IDs to fetch from both tables
      const bookingIds = tasks
        .filter(t => t.booking_id)
        .map(t => t.booking_id as number);

      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Fetch bookings from both active and past bookings tables
      let bookingsMap = new Map<number, AgentTask['booking']>();
      
      if (bookingIds.length > 0) {
        const [activeBookings, pastBookings] = await Promise.all([
          supabase
            .from('bookings')
            .select('id, date_only, address, postcode, service_type')
            .in('id', bookingIds),
          supabase
            .from('past_bookings')
            .select('id, date_only, address, postcode, service_type')
            .in('id', bookingIds)
        ]);

        // Combine results into map
        activeBookings.data?.forEach(b => bookingsMap.set(b.id, b));
        pastBookings.data?.forEach(b => bookingsMap.set(b.id, b));
      }

      // Map profiles and bookings to tasks
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const enrichedTasks = tasks.map(task => ({
        ...task,
        booking: task.booking_id ? bookingsMap.get(task.booking_id) || null : null,
        assigned_to_profile: profileMap.get(task.assigned_to) || null,
        assigned_by_profile: profileMap.get(task.assigned_by) || null
      }));

      setTasks(enrichedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (input: CreateTaskInput): Promise<AgentTask | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error: createError } = await supabase
        .from('agent_tasks')
        .insert({
          title: input.title,
          description: input.description || null,
          task_type: input.task_type,
          assigned_to: input.assigned_to,
          assigned_by: userData.user.id,
          customer_id: input.customer_id || null,
          booking_id: input.booking_id || null,
          priority: input.priority || 'medium',
          due_date: input.due_date || null,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Task created',
        description: 'The task has been assigned successfully.'
      });

      await fetchTasks();
      return data as AgentTask;
    } catch (err) {
      console.error('Error creating task:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create task',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateTask = async (input: UpdateTaskInput): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.task_type !== undefined) updateData.task_type = input.task_type;
      if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;
      if (input.customer_id !== undefined) updateData.customer_id = input.customer_id;
      if (input.booking_id !== undefined) updateData.booking_id = input.booking_id;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.due_date !== undefined) updateData.due_date = input.due_date;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.completed_at !== undefined) updateData.completed_at = input.completed_at;

      const { error: updateError } = await supabase
        .from('agent_tasks')
        .update(updateData)
        .eq('id', input.id);

      if (updateError) throw updateError;

      toast({
        title: 'Task updated',
        description: 'The task has been updated successfully.'
      });

      await fetchTasks();
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update task',
        variant: 'destructive'
      });
      return false;
    }
  };

  const completeTask = async (taskId: string, notes?: string): Promise<boolean> => {
    return updateTask({
      id: taskId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: notes || null
    });
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('agent_tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully.'
      });

      await fetchTasks();
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete task',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [options?.assignedTo, options?.status, options?.includeCompleted]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask
  };
};

export const useSalesAgents = () => {
  const [agents, setAgents] = useState<Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        // Get all sales agents
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'sales_agent');

        if (roleError) throw roleError;

        if (roleData && roleData.length > 0) {
          const userIds = roleData.map(r => r.user_id);
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, email')
            .in('user_id', userIds);

          if (profileError) throw profileError;
          setAgents(profiles || []);
        }
      } catch (err) {
        console.error('Error fetching sales agents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return { agents, loading };
};
