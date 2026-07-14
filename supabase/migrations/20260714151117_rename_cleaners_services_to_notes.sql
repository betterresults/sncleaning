-- Notes are free-text; structured service capability lives in cleaner_service_types.
-- Renaming legacy cleaners.services so the UI Notes field maps to an honest column.
ALTER TABLE public.cleaners RENAME COLUMN services TO notes;

COMMENT ON COLUMN public.cleaners.notes IS
  'Free-text admin notes about the cleaner. Service capabilities are stored in cleaner_service_types.';
