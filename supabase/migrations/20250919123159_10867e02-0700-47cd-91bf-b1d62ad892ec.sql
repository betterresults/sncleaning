-- Allow saving non-photo files for 'additional' uploads by permitting 'additional' in photo_type
ALTER TABLE public.cleaning_photos
  DROP CONSTRAINT IF EXISTS cleaning_photos_photo_type_check;

ALTER TABLE public.cleaning_photos
  ADD CONSTRAINT cleaning_photos_photo_type_check
  CHECK (photo_type IN ('before','after','additional'));
