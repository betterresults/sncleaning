-- Enable RLS on remaining tables and fix remaining security issues

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_completion_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;