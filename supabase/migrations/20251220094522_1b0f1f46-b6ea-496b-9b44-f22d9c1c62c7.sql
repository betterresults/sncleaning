-- Fix existing quote_leads by extracting UTM parameters from referrer URL
UPDATE quote_leads
SET 
  utm_source = CASE 
    WHEN referrer LIKE '%utm_source=%' THEN 
      regexp_replace(
        regexp_replace(referrer, '.*utm_source=([^&]+).*', '\1'),
        '%20', ' ', 'g'
      )
    ELSE utm_source
  END,
  utm_medium = CASE 
    WHEN referrer LIKE '%utm_medium=%' THEN 
      regexp_replace(
        regexp_replace(referrer, '.*utm_medium=([^&]+).*', '\1'),
        '%20', ' ', 'g'
      )
    ELSE utm_medium
  END,
  utm_campaign = CASE 
    WHEN referrer LIKE '%utm_campaign=%' THEN 
      regexp_replace(
        regexp_replace(referrer, '.*utm_campaign=([^&]+).*', '\1'),
        '%20', ' ', 'g'
      )
    ELSE utm_campaign
  END,
  source = CASE 
    -- Admin source (keep as is)
    WHEN page_url LIKE '%/admin/%' THEN 'admin'
    -- Extract from referrer UTM
    WHEN referrer LIKE '%utm_source=Facebook%' OR referrer LIKE '%utm_source=facebook%' THEN 'facebook'
    WHEN referrer LIKE '%utm_source=Instagram%' OR referrer LIKE '%utm_source=instagram%' THEN 'instagram'
    WHEN referrer LIKE '%utm_source=Google%' OR referrer LIKE '%utm_source=google%' THEN 'google'
    WHEN referrer LIKE '%utm_source=TikTok%' OR referrer LIKE '%utm_source=tiktok%' THEN 'tiktok'
    WHEN referrer LIKE '%utm_source=WhatsApp%' OR referrer LIKE '%utm_source=whatsapp%' THEN 'whatsapp'
    WHEN referrer LIKE '%utm_source=Email%' OR referrer LIKE '%utm_source=email%' THEN 'email'
    -- Check page_url for UTMs
    WHEN page_url LIKE '%utm_source=Facebook%' OR page_url LIKE '%utm_source=facebook%' THEN 'facebook'
    WHEN page_url LIKE '%utm_source=Instagram%' OR page_url LIKE '%utm_source=instagram%' THEN 'instagram'
    WHEN page_url LIKE '%utm_source=Google%' OR page_url LIKE '%utm_source=google%' THEN 'google'
    WHEN page_url LIKE '%utm_source=TikTok%' OR page_url LIKE '%utm_source=tiktok%' THEN 'tiktok'
    -- Check referrer domain
    WHEN referrer LIKE '%google.%' THEN 'google'
    WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%fb.%' THEN 'facebook'
    WHEN referrer LIKE '%instagram.%' THEN 'instagram'
    WHEN referrer LIKE '%tiktok.%' THEN 'tiktok'
    -- Internal referrer = direct
    WHEN referrer LIKE '%sncleaningservices.co.uk%' AND referrer NOT LIKE '%utm_source=%' THEN 'direct'
    WHEN referrer LIKE '%lovableproject.com%' AND referrer NOT LIKE '%utm_source=%' THEN 'direct'
    -- No referrer = direct
    WHEN referrer IS NULL OR referrer = '' THEN 'direct'
    -- Keep existing if we can't determine
    ELSE COALESCE(source, 'direct')
  END
WHERE source IS NULL 
   OR source = 'direct' 
   OR source = 'instagram'
   OR (referrer LIKE '%utm_source=%' AND (utm_source IS NULL OR utm_source = ''));