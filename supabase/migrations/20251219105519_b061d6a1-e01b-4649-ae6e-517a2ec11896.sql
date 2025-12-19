-- Create agent_tasks table for task assignment to sales agents
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'follow_up', -- 'follow_up', 'call_customer', 'check_service', 'other'
  assigned_to UUID NOT NULL, -- sales agent user_id
  assigned_by UUID NOT NULL, -- admin who assigned
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tasks
CREATE POLICY "Admins can manage all tasks"
ON public.agent_tasks
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

-- Sales agents can view their assigned tasks
CREATE POLICY "Sales agents can view their assigned tasks"
ON public.agent_tasks
FOR SELECT
USING (
  assigned_to = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'sales_agent'::app_role
  )
);

-- Sales agents can update their assigned tasks (status, notes)
CREATE POLICY "Sales agents can update their assigned tasks"
ON public.agent_tasks
FOR UPDATE
USING (
  assigned_to = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'sales_agent'::app_role
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_agent_tasks_updated_at
BEFORE UPDATE ON public.agent_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_agent_tasks_assigned_to ON public.agent_tasks(assigned_to);
CREATE INDEX idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX idx_agent_tasks_due_date ON public.agent_tasks(due_date);