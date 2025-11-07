-- Fix search_path for photo processing function (drop trigger first)
DROP TRIGGER IF EXISTS photo_processing_updated_at ON public.photo_processing_status;
DROP FUNCTION IF EXISTS update_photo_processing_updated_at();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION update_photo_processing_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER photo_processing_updated_at
  BEFORE UPDATE ON public.photo_processing_status
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_processing_updated_at();