-- Add assigned_sources column to profiles for sales agents
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assigned_sources text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.assigned_sources IS 'Array of customer sources this sales agent can access (e.g., Facebook, Google Ads). Empty means only see own created items.';