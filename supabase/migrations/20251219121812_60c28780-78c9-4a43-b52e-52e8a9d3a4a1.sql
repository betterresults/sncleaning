-- Add RLS policy for sales agents to view SMS templates
CREATE POLICY "Sales agents can view active SMS templates" 
ON public.sms_templates 
FOR SELECT 
USING (is_active = true AND has_role(auth.uid(), 'sales_agent'::app_role));