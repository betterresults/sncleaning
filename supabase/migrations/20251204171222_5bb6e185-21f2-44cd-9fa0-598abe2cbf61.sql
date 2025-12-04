-- Create function to schedule notifications when bookings are created
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
    
    -- Get booking datetime
    booking_datetime := COALESCE(NEW.date_time, (NEW.date_only::date + COALESCE(NEW.time_only, '09:00:00'::time)));
    
    -- Find all enabled triggers that use timing (booking_reminder type triggers)
    FOR trigger_rec IN
        SELECT * FROM notification_triggers
        WHERE is_enabled = true
        AND trigger_event IN ('booking_reminder', 'payment_reminder')
        AND timing_offset != 0
    LOOP
        -- Calculate scheduled time based on trigger settings
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
        
        -- Only schedule if the scheduled time is in the future
        IF scheduled_time > NOW() THEN
            -- Create schedule entries for each recipient type
            FOREACH recipient_type IN ARRAY trigger_rec.recipient_types
            LOOP
                IF recipient_type = 'customer' AND customer_email IS NOT NULL THEN
                    INSERT INTO notification_schedules (
                        trigger_id,
                        entity_type,
                        entity_id,
                        recipient_email,
                        recipient_type,
                        scheduled_for,
                        status
                    ) VALUES (
                        trigger_rec.id,
                        'booking',
                        NEW.id::text,
                        customer_email,
                        'customer',
                        scheduled_time,
                        'scheduled'
                    )
                    ON CONFLICT DO NOTHING;
                    
                ELSIF recipient_type = 'cleaner' AND cleaner_email IS NOT NULL THEN
                    INSERT INTO notification_schedules (
                        trigger_id,
                        entity_type,
                        entity_id,
                        recipient_email,
                        recipient_type,
                        scheduled_for,
                        status
                    ) VALUES (
                        trigger_rec.id,
                        'booking',
                        NEW.id::text,
                        cleaner_email,
                        'cleaner',
                        scheduled_time,
                        'scheduled'
                    )
                    ON CONFLICT DO NOTHING;
                    
                ELSIF recipient_type = 'admin' THEN
                    INSERT INTO notification_schedules (
                        trigger_id,
                        entity_type,
                        entity_id,
                        recipient_email,
                        recipient_type,
                        scheduled_for,
                        status
                    ) VALUES (
                        trigger_rec.id,
                        'booking',
                        NEW.id::text,
                        admin_email,
                        'admin',
                        scheduled_time,
                        'scheduled'
                    )
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Create trigger for scheduling notifications on new bookings
DROP TRIGGER IF EXISTS schedule_notifications_on_booking ON bookings;
CREATE TRIGGER schedule_notifications_on_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION schedule_booking_notifications();

-- Also cancel scheduled notifications when booking is cancelled
CREATE OR REPLACE FUNCTION cancel_scheduled_notifications_on_booking_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.booking_status = 'cancelled' AND (OLD.booking_status IS NULL OR OLD.booking_status != 'cancelled') THEN
        UPDATE notification_schedules
        SET status = 'cancelled', updated_at = NOW()
        WHERE entity_type = 'booking'
        AND entity_id = NEW.id::text
        AND status = 'scheduled';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cancel_notifications_on_booking_cancel ON bookings;
CREATE TRIGGER cancel_notifications_on_booking_cancel
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION cancel_scheduled_notifications_on_booking_cancel();