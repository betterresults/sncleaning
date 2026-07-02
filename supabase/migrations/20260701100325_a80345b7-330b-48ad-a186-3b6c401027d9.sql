-- Allow cleaners to set multiple availability blocks per day (e.g. 9-12 and 14-17)
-- Previously one row per cleaner per day; now multiple rows per day are allowed.
ALTER TABLE public.cleaner_working_hours
  DROP CONSTRAINT cleaner_working_hours_cleaner_id_day_of_week_key;

CREATE INDEX idx_cleaner_working_hours_cleaner_day ON public.cleaner_working_hours(cleaner_id, day_of_week);
