-- Enable RLS on the remaining tables that have policies but RLS disabled
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_bookings ENABLE ROW LEVEL SECURITY;