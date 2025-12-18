-- Fix existing quote_leads records: extract UTM params from referrer URLs
UPDATE quote_leads 
SET 
  utm_source = (regexp_match(referrer, 'utm_source=([^&]+)'))[1],
  utm_medium = (regexp_match(referrer, 'utm_medium=([^&]+)'))[1],
  utm_campaign = (regexp_match(referrer, 'utm_campaign=([^&]+)'))[1],
  utm_term = (regexp_match(referrer, 'utm_term=([^&]+)'))[1],
  utm_content = (regexp_match(referrer, 'utm_content=([^&]+)'))[1],
  source = LOWER(COALESCE(
    (regexp_match(referrer, 'utm_source=([^&]+)'))[1],
    source
  ))
WHERE referrer LIKE '%utm_source=%' 
AND utm_source IS NULL;