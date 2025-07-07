-- Disable the automatic chat creation trigger that's creating unwanted chats
DROP TRIGGER IF EXISTS trigger_handle_cleaner_assignment_chat ON public.bookings;

-- Also drop the function since it's causing the issue
DROP FUNCTION IF EXISTS public.handle_cleaner_assignment_chat();