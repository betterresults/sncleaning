-- Create customer payment methods table to store Stripe customer IDs and payment methods
CREATE TABLE public.customer_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for customer payment methods
CREATE POLICY "Customers can view their own payment methods" 
ON public.customer_payment_methods 
FOR SELECT 
USING (customer_id IN (
  SELECT profiles.customer_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
));

CREATE POLICY "Customers can insert their own payment methods" 
ON public.customer_payment_methods 
FOR INSERT 
WITH CHECK (customer_id IN (
  SELECT profiles.customer_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
));

CREATE POLICY "Customers can update their own payment methods" 
ON public.customer_payment_methods 
FOR UPDATE 
USING (customer_id IN (
  SELECT profiles.customer_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
));

CREATE POLICY "Customers can delete their own payment methods" 
ON public.customer_payment_methods 
FOR DELETE 
USING (customer_id IN (
  SELECT profiles.customer_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
));

CREATE POLICY "Admins can manage all payment methods" 
ON public.customer_payment_methods 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'::app_role
));

-- Create indexes for better performance
CREATE INDEX idx_customer_payment_methods_customer_id ON public.customer_payment_methods(customer_id);
CREATE INDEX idx_customer_payment_methods_stripe_customer_id ON public.customer_payment_methods(stripe_customer_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_payment_methods_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_payment_methods_updated_at
BEFORE UPDATE ON public.customer_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_methods_updated_at_column();