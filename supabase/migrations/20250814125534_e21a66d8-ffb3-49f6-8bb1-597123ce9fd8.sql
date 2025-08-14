-- Add missing columns for recurring bookings functionality

-- Add recurring_group_id to bookings table to group recurring bookings together
ALTER TABLE public.bookings 
ADD COLUMN recurring_group_id uuid;

-- Add was_created_until to recurring_services table to track generation progress
ALTER TABLE public.recurring_services 
ADD COLUMN was_created_until date;

-- Create index on recurring_group_id for better performance
CREATE INDEX idx_bookings_recurring_group_id ON public.bookings(recurring_group_id);

-- Update the generate_recurring_bookings function to work correctly
CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    rs RECORD;
    booking_date date;
    booking_datetime timestamptz;
    day_name text;
    addr RECORD;
    latest_inserted_date date;
BEGIN
    FOR rs IN 
        SELECT * 
        FROM public.recurring_services
        WHERE postponed IS DISTINCT FROM TRUE
    LOOP
        -- Determine where to start from: either last created or start_date
        booking_date := COALESCE(rs.was_created_until, rs.start_date, CURRENT_DATE);

        -- Cap generation at 30 days into the future
        WHILE booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP

            -- Match the specific day of the week
            day_name := trim(both from to_char(booking_date, 'Day'));
            IF day_name = rs.days_of_the_week THEN

                booking_datetime := booking_date + rs.start_time;

                -- Get address and postcode from addresses table
                SELECT address, postcode INTO addr
                FROM public.addresses 
                WHERE id = rs.address;

                -- Insert booking directly without checking for duplicates
                INSERT INTO public.bookings (
                    customer, cleaning_type, date_time, address, postcode,
                    cleaner, hours_required, cleaning_cost_per_hour, total_cost,
                    cleaner_rate, cleaner_pay, payment_method, booking_status,
                    recurring_group_id, date_only
                )
                VALUES (
                    rs.customer, rs.cleaning_type, booking_datetime, addr.address, addr.postcode,
                    rs.cleaner, rs.hours::numeric, rs.cost_per_hour, rs.total_cost,
                    rs.cleaner_rate, (rs.total_cost * rs.cleaner_rate / 100), rs.payment_method, 'active',
                    rs.recurring_group_id, booking_date
                );

                -- Track the furthest date we've inserted
                latest_inserted_date := booking_date;
            END IF;

            -- Move forward by interval (e.g. 7 days, 30 days, etc.)
            booking_date := booking_date + rs.interval::interval;
        END LOOP;

        -- Update was_created_until if we inserted at least one booking
        IF latest_inserted_date IS NOT NULL THEN
            UPDATE public.recurring_services
            SET was_created_until = latest_inserted_date
            WHERE id = rs.id;
        END IF;
    END LOOP;
END;
$function$;