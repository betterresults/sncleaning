-- Drop and recreate the sales agent SELECT policy with correct schema prefix
DROP POLICY IF EXISTS "Sales agents can view their assigned tasks" ON public.agent_tasks;

CREATE POLICY "Sales agents can view their assigned tasks"
ON public.agent_tasks
FOR SELECT
USING (
  assigned_to = auth.uid() 
  AND public.has_role(auth.uid(), 'sales_agent'::app_role)
);

-- Also fix the UPDATE policy with correct schema prefix
DROP POLICY IF EXISTS "Sales agents can update their assigned tasks" ON public.agent_tasks;

CREATE POLICY "Sales agents can update their assigned tasks"
ON public.agent_tasks
FOR UPDATE
USING (
  assigned_to = auth.uid() 
  AND public.has_role(auth.uid(), 'sales_agent'::app_role)
);