-- Add RLS policy for sales agents to view past bookings
CREATE POLICY "Sales agents can view past bookings"
ON public.past_bookings
FOR SELECT
USING (has_role(auth.uid(), 'sales_agent'::app_role));