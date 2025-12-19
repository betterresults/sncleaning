-- Remove the foreign key constraint on booking_id so tasks can reference both active and past bookings
ALTER TABLE public.agent_tasks DROP CONSTRAINT IF EXISTS agent_tasks_booking_id_fkey;