-- Create a SECURITY DEFINER function to check user roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop and recreate the sales agent SELECT policy using the function
DROP POLICY IF EXISTS "Sales agents can view their assigned tasks" ON public.agent_tasks;

CREATE POLICY "Sales agents can view their assigned tasks"
ON public.agent_tasks
FOR SELECT
USING (
  assigned_to = auth.uid() 
  AND public.has_role(auth.uid(), 'sales_agent')
);

-- Also fix the UPDATE policy
DROP POLICY IF EXISTS "Sales agents can update their assigned tasks" ON public.agent_tasks;

CREATE POLICY "Sales agents can update their assigned tasks"
ON public.agent_tasks
FOR UPDATE
USING (
  assigned_to = auth.uid() 
  AND public.has_role(auth.uid(), 'sales_agent')
);