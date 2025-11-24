-- Create trigger to move cancelled bookings to past_bookings
CREATE OR REPLACE FUNCTION public.move_cancelled_booking_to_past()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    insert_successful BOOLEAN := FALSE;
BEGIN
    -- Only process if booking is being cancelled
    IF NEW.booking_status = 'cancelled' AND 
       (OLD.booking_status IS NULL OR OLD.booking_status != 'cancelled') THEN
        
        BEGIN
            -- Insert into past_bookings
            INSERT INTO public.past_bookings (
                id, first_name, last_name, phone_number, email, coupon_code, booking_id,
                date_time, additional_details, property_details, frequently, first_cleaning,
                service_type, occupied, hours_required, total_hours, ironing_hours,
                days_number, days, cleaning_time, carpet_items, exclude_areas,
                upholstery_items, mattress_items, extras, linens, ironing, address,
                postcode, parking_details, key_collection, access, agency, record_message,
                video_message, cost_deduction, cleaning_cost_per_visit, cleaning_cost_per_hour,
                steam_cleaning_cost, total_cost, deposit, cleaning_type, result_page,
                date_submited, edit_admin, oven_size, payment_method, payment_status,
                payment_term, invoice_id, invoice_link, invoice_term, booking_status,
                cleaner, cleaner_pay, date_only, customer, company
            )
            VALUES (
                NEW.id, NEW.first_name, NEW.last_name, NEW.phone_number, NEW.email,
                NEW.coupon_code, NEW.booking_id, NEW.date_time, NEW.additional_details,
                NEW.property_details, NEW.frequently, NEW.first_cleaning, NEW.service_type,
                NEW.occupied, NEW.hours_required, NEW.total_hours, NEW.ironing_hours,
                NEW.days_number, NEW.days, NEW.cleaning_time, NEW.carpet_items,
                NEW.exclude_areas, NEW.upholstery_items, NEW.mattress_items, NEW.extras,
                NEW.linens, NEW.ironing, NEW.address, NEW.postcode, NEW.parking_details,
                NEW.key_collection, NEW.access, NEW.agency, NEW.record_message,
                NEW.video_message, NEW.cost_deduction, NEW.cleaning_cost_per_visit,
                NEW.cleaning_cost_per_hour::text, NEW.steam_cleaning_cost, NEW.total_cost::text,
                NEW.deposit::text, NEW.cleaning_type, NEW.result_page, NEW.date_submited,
                NEW.edit_admin, NEW.oven_size, NEW.payment_method, NEW.payment_status,
                NEW.payment_term, NEW.invoice_id, NEW.invoice_link, NEW.invoice_term::text,
                NEW.booking_status, NEW.cleaner, NEW.cleaner_pay, NEW.date_only,
                NEW.customer, NEW.company
            )
            ON CONFLICT (id) DO UPDATE SET
                booking_status = EXCLUDED.booking_status,
                payment_status = EXCLUDED.payment_status,
                invoice_id = EXCLUDED.invoice_id;
            
            insert_successful := TRUE;
            
            RAISE NOTICE 'Successfully moved cancelled booking % to past_bookings', NEW.id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error moving cancelled booking to past_bookings: %', SQLERRM;
        END;

        -- Delete from bookings table if insert was successful
        IF insert_successful THEN
            DELETE FROM public.bookings WHERE id = NEW.id;
            RAISE NOTICE 'Deleted cancelled booking % from bookings table', NEW.id;
        END IF;
        
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
-- This trigger should fire AFTER the Stripe cancellation trigger
DROP TRIGGER IF EXISTS trigger_move_cancelled_to_past ON public.bookings;
CREATE TRIGGER trigger_move_cancelled_to_past
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.move_cancelled_booking_to_past();