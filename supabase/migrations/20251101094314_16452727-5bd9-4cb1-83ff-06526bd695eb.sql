-- Drop and recreate functions with proper type handling
DROP FUNCTION IF EXISTS round_bookings_prices();
DROP FUNCTION IF EXISTS round_past_bookings_prices();

-- Create function to round all prices in bookings table
CREATE OR REPLACE FUNCTION round_bookings_prices()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE bookings 
  SET 
    total_cost = ROUND(total_cost::numeric, 2),
    cleaner_pay = ROUND(cleaner_pay::numeric, 2),
    cleaner_rate = ROUND(cleaner_rate::numeric, 2),
    cleaning_cost_per_hour = ROUND(cleaning_cost_per_hour::numeric, 2),
    hours_required = ROUND(hours_required::numeric, 2),
    total_hours = ROUND(total_hours::numeric, 2),
    cleaning_time = ROUND(cleaning_time::numeric, 2),
    ironing_hours = ROUND(ironing_hours::numeric, 2),
    cleaner_percentage = ROUND(cleaner_percentage::numeric, 2)
  WHERE 
    total_cost IS NOT NULL OR 
    cleaner_pay IS NOT NULL OR 
    cleaner_rate IS NOT NULL OR
    cleaning_cost_per_hour IS NOT NULL OR
    hours_required IS NOT NULL OR
    total_hours IS NOT NULL OR
    cleaning_time IS NOT NULL OR
    ironing_hours IS NOT NULL OR
    cleaner_percentage IS NOT NULL;
    
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to round all prices in past_bookings table (handling text fields)
CREATE OR REPLACE FUNCTION round_past_bookings_prices()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Handle text fields that need conversion
  UPDATE past_bookings 
  SET 
    total_cost = CASE 
      WHEN total_cost ~ '^[0-9.]+$' THEN ROUND(total_cost::numeric, 2)::text
      ELSE total_cost
    END,
    cleaning_cost_per_hour = CASE
      WHEN cleaning_cost_per_hour ~ '^[0-9.]+$' THEN ROUND(cleaning_cost_per_hour::numeric, 2)::text
      ELSE cleaning_cost_per_hour
    END,
    deposit = CASE
      WHEN deposit ~ '^[0-9.]+$' THEN ROUND(deposit::numeric, 2)::text
      ELSE deposit
    END,
    invoice_term = CASE
      WHEN invoice_term ~ '^[0-9.]+$' THEN ROUND(invoice_term::numeric, 2)::text
      ELSE invoice_term
    END
  WHERE 
    (total_cost IS NOT NULL AND total_cost ~ '^[0-9.]+$') OR
    (cleaning_cost_per_hour IS NOT NULL AND cleaning_cost_per_hour ~ '^[0-9.]+$') OR
    (deposit IS NOT NULL AND deposit ~ '^[0-9.]+$') OR
    (invoice_term IS NOT NULL AND invoice_term ~ '^[0-9.]+$');
  
  -- Handle numeric fields
  UPDATE past_bookings
  SET
    cleaner_pay = ROUND(cleaner_pay::numeric, 2),
    hours_required = ROUND(hours_required::numeric, 2),
    total_hours = ROUND(total_hours::numeric, 2),
    cleaning_time = ROUND(cleaning_time::numeric, 2),
    ironing_hours = ROUND(ironing_hours::numeric, 2)
  WHERE
    cleaner_pay IS NOT NULL OR
    hours_required IS NOT NULL OR
    total_hours IS NOT NULL OR
    cleaning_time IS NOT NULL OR
    ironing_hours IS NOT NULL;
    
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;