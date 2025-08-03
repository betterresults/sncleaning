-- Fix critical RLS policy issues and enable RLS on missing tables

-- First, fix the infinite recursion in user_roles policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create simpler, non-recursive user_roles policies
CREATE POLICY "Allow viewing own user role" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow service role to manage user roles" ON public.user_roles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Enable RLS on tables that have policies but no RLS enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;