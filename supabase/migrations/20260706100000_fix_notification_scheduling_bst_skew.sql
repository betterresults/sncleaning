-- Fix: notification_schedules.scheduled_for was computed directly from
-- bookings.date_time, which is stored as naive London wall-clock digits with a
-- hardcoded +00:00 suffix (not a true UTC instant). During BST (UTC+1), that makes
-- the stored instant 1 real hour later than the true London time it represents, so
-- every reminder/notification computed from it (before AND after the booking) fired
-- roughly 1 hour later than intended.
--
-- Fix: reinterpret the naive digits as true Europe/London wall-clock time (DST-aware)
-- before doing interval arithmetic, instead of treating them as literal UTC.

CREATE OR REPLACE FUNCTION schedule_booking_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    trigger_rec RECORD;
    customer_email TEXT;
    cleaner_email TEXT;
    admin_email TEXT := 'sales@sncleaningservices.co.uk';
    booking_naive TIMESTAMP;
    booking_datetime TIMESTAMPTZ;
    scheduled_time TIMESTAMPTZ;
    recipient_type TEXT;
BEGIN
    -- Get customer email
    SELECT email INTO customer_email
    FROM customers WHERE id = NEW.customer;

    -- Get cleaner email if assigned
    IF NEW.cleaner IS NOT NULL THEN
        SELECT email INTO cleaner_email
        FROM cleaners WHERE id = NEW.cleaner;
    END IF;

    -- NEW.date_time's UTC digits ARE the intended London wall-clock digits (see
    -- src/lib/ukTime.ts for the same convention on the frontend). Extract those naive
    -- digits, then reinterpret them as Europe/London to get a true, DST-aware UTC
    -- instant — instead of treating the fake +00:00 label as literal UTC.
    booking_naive := COALESCE(
        (NEW.date_time AT TIME ZONE 'UTC'),
        (NEW.date_only::date + COALESCE(NEW.time_only, '09:00:00'::time))
    );
    booking_datetime := booking_naive AT TIME ZONE 'Europe/London';

    -- Find ALL enabled triggers that have timing (not immediate)
    -- This includes: booking_created, booking_reminder, payment_reminder, payment_collection, etc.
    FOR trigger_rec IN
        SELECT * FROM notification_triggers
        WHERE is_enabled = true
        AND timing_offset IS NOT NULL
        AND timing_offset != 0
        -- Only schedule triggers that make sense at booking creation time
        AND trigger_event IN (
            'booking_created',      -- e.g., send payment card request 5 min after booking
            'booking_reminder',     -- e.g., remind 24h before booking
            'payment_reminder',     -- e.g., remind about payment before booking
            'payment_collection'    -- e.g., request payment card after booking
        )
    LOOP
        -- Calculate scheduled time based on trigger settings
        -- Negative offset = BEFORE the booking date
        -- Positive offset = AFTER the booking date (or after creation for booking_created)
        IF trigger_rec.trigger_event = 'booking_created' THEN
            -- For booking_created, timing is relative to NOW (creation time)
            CASE trigger_rec.timing_unit
                WHEN 'minutes' THEN
                    scheduled_time := NOW() + (trigger_rec.timing_offset || ' minutes')::interval;
                WHEN 'hours' THEN
                    scheduled_time := NOW() + (trigger_rec.timing_offset || ' hours')::interval;
                WHEN 'days' THEN
                    scheduled_time := NOW() + (trigger_rec.timing_offset || ' days')::interval;
                ELSE
                    scheduled_time := NOW() + (trigger_rec.timing_offset || ' hours')::interval;
            END CASE;
        ELSE
            -- For reminders, timing is relative to booking datetime
            CASE trigger_rec.timing_unit
                WHEN 'minutes' THEN
                    scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' minutes')::interval;
                WHEN 'hours' THEN
                    scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' hours')::interval;
                WHEN 'days' THEN
                    scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' days')::interval;
                ELSE
                    scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' hours')::interval;
            END CASE;
        END IF;

        -- Only schedule if the scheduled time is in the future
        IF scheduled_time > NOW() THEN
            -- Create schedule entries for each recipient type
            FOREACH recipient_type IN ARRAY trigger_rec.recipient_types
            LOOP
                IF recipient_type = 'customer' AND customer_email IS NOT NULL THEN
                    INSERT INTO notification_schedules (
                        trigger_id, entity_type, entity_id, recipient_email, recipient_type, scheduled_for, status
                    ) VALUES (
                        trigger_rec.id, 'booking', NEW.id::text, customer_email, 'customer', scheduled_time, 'scheduled'
                    )
                    ON CONFLICT DO NOTHING;

                ELSIF recipient_type = 'cleaner' AND cleaner_email IS NOT NULL THEN
                    INSERT INTO notification_schedules (
                        trigger_id, entity_type, entity_id, recipient_email, recipient_type, scheduled_for, status
                    ) VALUES (
                        trigger_rec.id, 'booking', NEW.id::text, cleaner_email, 'cleaner', scheduled_time, 'scheduled'
                    )
                    ON CONFLICT DO NOTHING;

                ELSIF recipient_type = 'admin' THEN
                    INSERT INTO notification_schedules (
                        trigger_id, entity_type, entity_id, recipient_email, recipient_type, scheduled_for, status
                    ) VALUES (
                        trigger_rec.id, 'booking', NEW.id::text, admin_email, 'admin', scheduled_time, 'scheduled'
                    )
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;
