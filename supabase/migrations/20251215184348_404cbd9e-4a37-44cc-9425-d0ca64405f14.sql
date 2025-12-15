-- Fix source for existing leads based on referrer data
UPDATE quote_leads 
SET source = CASE 
  WHEN referrer ILIKE '%instagram%' THEN 'instagram'
  WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%fb.com%' THEN 'facebook'
  WHEN referrer ILIKE '%google%' THEN 'google'
  WHEN referrer ILIKE '%tiktok%' THEN 'tiktok'
  WHEN referrer ILIKE '%twitter%' OR referrer ILIKE '%x.com%' THEN 'twitter'
  WHEN referrer ILIKE '%linkedin%' THEN 'linkedin'
  WHEN referrer ILIKE '%bing%' THEN 'bing'
  WHEN referrer ILIKE '%pinterest%' THEN 'pinterest'
  WHEN referrer ILIKE '%youtube%' THEN 'youtube'
  WHEN referrer ILIKE '%nextdoor%' THEN 'nextdoor'
  ELSE source
END
WHERE referrer IS NOT NULL 
  AND referrer != '' 
  AND referrer NOT ILIKE '%sncleaningservices%'
  AND referrer NOT ILIKE '%lovable%'
  AND (source = 'direct' OR source = 'website' OR source IS NULL);