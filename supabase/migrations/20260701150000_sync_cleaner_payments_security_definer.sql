-- Bug: customers assigning a cleaner via NewBookingForm (the only booking form that lets a
-- non-admin/non-sales-agent pick a cleaner) could never actually create the booking. The
-- AFTER INSERT trigger `sync_cleaner_payments_trigger` calls
-- sync_cleaner_payments_on_booking_change(), which INSERTs into `cleaner_payments` — a table
-- whose RLS policies only grant INSERT/UPDATE/DELETE to admins and sales agents (see
-- 20251226131233_04c55d38-31ad-4630-8000-9e222a4decb3.sql). Because the trigger function ran
-- with the *caller's* privileges, a customer's booking insert would fire the trigger, the
-- trigger's cleaner_payments insert would be rejected by RLS ("new row violates row-level
-- security policy for table \"cleaner_payments\""), and Postgres would roll back the entire
-- booking insert — so the booking silently never got created at all.
--
-- Fix: mark the trigger function SECURITY DEFINER (same pattern as get_assignable_cleaners)
-- so it always runs with the privileges of its owner, bypassing cleaner_payments RLS
-- regardless of who triggered the booking insert/update/delete. The function itself still
-- only ever writes a payment row scoped to the booking that fired it, so this doesn't widen
-- what any role can directly read/write on cleaner_payments.
CREATE OR REPLACE FUNCTION sync_cleaner_payments_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle DELETE: remove primary cleaner payment entry
  IF TG_OP = 'DELETE' THEN
    DELETE FROM cleaner_payments 
    WHERE booking_id = OLD.id AND is_primary = true;
    RETURN OLD;
  END IF;

  -- Handle INSERT: create payment entry if cleaner is assigned
  IF TG_OP = 'INSERT' THEN
    IF NEW.cleaner IS NOT NULL THEN
      INSERT INTO cleaner_payments (
        booking_id,
        cleaner_id,
        is_primary,
        payment_type,
        calculated_pay,
        hourly_rate,
        percentage_rate,
        status
      ) VALUES (
        NEW.id,
        NEW.cleaner,
        true,
        'percentage',
        COALESCE(NEW.cleaner_pay, 0),
        COALESCE(NEW.cleaner_rate, 0),
        COALESCE(NEW.cleaner_percentage, 0),
        'assigned'
      )
      ON CONFLICT (booking_id, cleaner_id) WHERE is_primary = true
      DO UPDATE SET
        calculated_pay = EXCLUDED.calculated_pay,
        hourly_rate = EXCLUDED.hourly_rate,
        percentage_rate = EXCLUDED.percentage_rate,
        updated_at = now();
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If cleaner was removed (set to NULL), delete the primary payment entry
    IF OLD.cleaner IS NOT NULL AND NEW.cleaner IS NULL THEN
      DELETE FROM cleaner_payments 
      WHERE booking_id = NEW.id AND cleaner_id = OLD.cleaner AND is_primary = true;
    
    -- If cleaner was changed to a different cleaner
    ELSIF OLD.cleaner IS DISTINCT FROM NEW.cleaner AND NEW.cleaner IS NOT NULL THEN
      -- Remove old cleaner's primary payment if exists
      IF OLD.cleaner IS NOT NULL THEN
        DELETE FROM cleaner_payments 
        WHERE booking_id = NEW.id AND cleaner_id = OLD.cleaner AND is_primary = true;
      END IF;
      
      -- Add new cleaner's payment entry
      INSERT INTO cleaner_payments (
        booking_id,
        cleaner_id,
        is_primary,
        payment_type,
        calculated_pay,
        hourly_rate,
        percentage_rate,
        status
      ) VALUES (
        NEW.id,
        NEW.cleaner,
        true,
        'percentage',
        COALESCE(NEW.cleaner_pay, 0),
        COALESCE(NEW.cleaner_rate, 0),
        COALESCE(NEW.cleaner_percentage, 0),
        'assigned'
      )
      ON CONFLICT (booking_id, cleaner_id) WHERE is_primary = true
      DO UPDATE SET
        calculated_pay = EXCLUDED.calculated_pay,
        hourly_rate = EXCLUDED.hourly_rate,
        percentage_rate = EXCLUDED.percentage_rate,
        updated_at = now();
    
    -- If same cleaner but pay details changed
    ELSIF NEW.cleaner IS NOT NULL AND (
      OLD.cleaner_pay IS DISTINCT FROM NEW.cleaner_pay OR
      OLD.cleaner_rate IS DISTINCT FROM NEW.cleaner_rate OR
      OLD.cleaner_percentage IS DISTINCT FROM NEW.cleaner_percentage
    ) THEN
      UPDATE cleaner_payments
      SET 
        calculated_pay = COALESCE(NEW.cleaner_pay, 0),
        hourly_rate = COALESCE(NEW.cleaner_rate, 0),
        percentage_rate = COALESCE(NEW.cleaner_percentage, 0),
        updated_at = now()
      WHERE booking_id = NEW.id AND cleaner_id = NEW.cleaner AND is_primary = true;
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
