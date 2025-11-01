-- Drop and recreate the move_to_past_bookings_table function with proper error handling
CREATE OR REPLACE FUNCTION public.move_to_past_bookings_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec bookings%ROWTYPE;
  insert_successful BOOLEAN;
  moved_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting move_to_past_bookings_table at %', NOW();
  
  FOR rec IN 
    SELECT * FROM public.bookings
    WHERE date_time < now()
  LOOP
    -- Reset flag for each booking
    insert_successful := FALSE;
    
    BEGIN
      -- Try to insert into past_bookings
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
        cleaner, cleaner_pay, company, date_only, customer, same_day
      )
      VALUES (
        rec.id, rec.first_name, rec.last_name, rec.phone_number, rec.email,
        rec.coupon_code, rec.id, rec.date_time, rec.additional_details,
        rec.property_details, rec.frequently, rec.first_cleaning, rec.service_type,
        rec.occupied, rec.hours_required, rec.total_hours, rec.ironing_hours,
        rec.days_number, rec.days, rec.cleaning_time, rec.carpet_items,
        rec.exclude_areas, rec.upholstery_items, rec.mattress_items, rec.extras,
        rec.linens, rec.ironing, rec.address, rec.postcode, rec.parking_details,
        rec.key_collection, rec.access, rec.agency, rec.record_message,
        rec.video_message, rec.cost_deduction, rec.cleaning_cost_per_visit,
        rec.cleaning_cost_per_hour, rec.steam_cleaning_cost, rec.total_cost,
        rec.deposit, rec.cleaning_type, rec.result_page, rec.date_submited,
        rec.edit_admin, rec.oven_size, rec.payment_method, rec.payment_status,
        rec.payment_term, rec.invoice_id, rec.invoice_link, rec.invoice_term,
        rec.booking_status, rec.cleaner, rec.cleaner_pay, rec.company,
        rec.date_only, rec.customer, rec.same_day
      );
      
      -- If we got here, insert was successful
      insert_successful := TRUE;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Booking already exists in past_bookings, we can still delete from bookings
        RAISE NOTICE 'Booking ID % already exists in past_bookings, will still delete from bookings', rec.id;
        insert_successful := TRUE;
      WHEN OTHERS THEN
        -- Log error and skip this booking
        RAISE WARNING 'Failed to insert booking ID % into past_bookings: %', rec.id, SQLERRM;
        error_count := error_count + 1;
        insert_successful := FALSE;
    END;
    
    -- Only delete if insert was successful
    IF insert_successful THEN
      BEGIN
        DELETE FROM public.bookings WHERE id = rec.id;
        moved_count := moved_count + 1;
        RAISE NOTICE 'Successfully moved booking ID % to past_bookings', rec.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to delete booking ID % from bookings after successful insert: %', rec.id, SQLERRM;
          error_count := error_count + 1;
      END;
    ELSE
      RAISE NOTICE 'Booking ID % was NOT moved due to insert failure - remains in bookings table', rec.id;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Completed move_to_past_bookings_table: % moved, % errors', moved_count, error_count;
END;
$function$;