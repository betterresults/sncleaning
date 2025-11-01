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

-- Create function to round all prices in past_bookings table
CREATE OR REPLACE FUNCTION round_past_bookings_prices()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE past_bookings 
  SET 
    total_cost = ROUND(total_cost::numeric, 2),
    cleaner_pay = ROUND(cleaner_pay::numeric, 2),
    cleaning_cost_per_hour = ROUND(cleaning_cost_per_hour::numeric, 2),
    hours_required = ROUND(hours_required::numeric, 2),
    total_hours = ROUND(total_hours::numeric, 2),
    cleaning_time = ROUND(cleaning_time::numeric, 2),
    ironing_hours = ROUND(ironing_hours::numeric, 2)
  WHERE 
    total_cost IS NOT NULL OR 
    cleaner_pay IS NOT NULL OR 
    cleaning_cost_per_hour IS NOT NULL OR
    hours_required IS NOT NULL OR
    total_hours IS NOT NULL OR
    cleaning_time IS NOT NULL OR
    ironing_hours IS NOT NULL;
    
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;