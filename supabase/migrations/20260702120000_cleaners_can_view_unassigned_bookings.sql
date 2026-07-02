-- The existing SELECT policy on `bookings` only lets a cleaner see rows where
-- `cleaner = get_user_cleaner_id(auth.uid())`. Since that column is NULL on
-- unassigned bookings, `NULL = <cleaner_id>` never evaluates to true, so the
-- cleaner-facing "Available Bookings" marketplace list (CleanerAvailableBookings.tsx)
-- always returned zero rows for real (non-admin) cleaner accounts. Add an explicit
-- branch allowing any user with a linked cleaner profile to view unassigned bookings.
DROP POLICY IF EXISTS "Admins, sales agents, customers and cleaners can view bookings" ON public.bookings;

CREATE POLICY "Admins, sales agents, customers and cleaners can view bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'sales_agent'::app_role) AND created_by_user_id = auth.uid())
  OR (customer = get_user_customer_id(auth.uid()))
  OR (cleaner = get_user_cleaner_id(auth.uid()))
  OR is_cleaner_assigned_to_booking(auth.uid(), id)
  OR (cleaner IS NULL AND get_user_cleaner_id(auth.uid()) IS NOT NULL)
);
