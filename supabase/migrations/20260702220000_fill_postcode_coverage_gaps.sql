-- Fills in postcode_prefixes for boroughs that were defined as coverage areas but had
-- zero (or very few) postcode prefixes mapped to them, so postcodes in those real
-- London boroughs actually resolve during cleaner-area matching instead of silently
-- falling through as "unresolved". All prefixes below are picked to avoid colliding
-- with prefixes already claimed by other boroughs (postcode_prefixes.prefix is
-- globally unique in this schema - each outward code maps to exactly one borough).
--
-- "City of London" existed as a coverage_region with no coverage_boroughs row at all
-- (an earlier migration's insert silently produced no boroughs/prefixes), so its
-- General borough is created here before prefixes are attached to it.

INSERT INTO public.coverage_boroughs (name, region_id, display_order, is_active)
SELECT 'General', id, 0, true
FROM public.coverage_regions
WHERE name = 'City of London'
  AND NOT EXISTS (
    SELECT 1 FROM public.coverage_boroughs WHERE region_id = coverage_regions.id
  );

-- Brent: Kilburn, Harlesden/Willesden, Wembley
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('NW6'), ('NW10'), ('HA0'), ('HA9')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Brent')
ON CONFLICT (prefix) DO NOTHING;

-- Westminster: West End, Victoria/Pimlico/Belgravia, Paddington/Bayswater, Maida Vale,
-- Covent Garden/Strand, St John's Wood
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('SW1'), ('W1'), ('W2'), ('W9'), ('WC2'), ('NW8')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Westminster')
ON CONFLICT (prefix) DO NOTHING;

-- Islington: Highbury, Holloway, Archway/Tufnell Park, Angel/Clerkenwell
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('N5'), ('N7'), ('N19'), ('EC1')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Islington')
ON CONFLICT (prefix) DO NOTHING;

-- Southwark: Camberwell, Peckham, Rotherhithe, Walworth, East Dulwich
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('SE5'), ('SE15'), ('SE16'), ('SE17'), ('SE22')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Southwark')
ON CONFLICT (prefix) DO NOTHING;

-- Wandsworth: Battersea, Putney, Tooting, Wandsworth Town
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('SW11'), ('SW15'), ('SW17'), ('SW18')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Wandsworth')
ON CONFLICT (prefix) DO NOTHING;

-- Waltham Forest: Chingford, Leyton, Leytonstone, Walthamstow
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('E4'), ('E10'), ('E11'), ('E17')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Waltham Forest')
ON CONFLICT (prefix) DO NOTHING;

-- Hounslow: Hounslow, Cranford, Heston, Isleworth, Brentford
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('TW3'), ('TW4'), ('TW5'), ('TW7'), ('TW8')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Hounslow')
ON CONFLICT (prefix) DO NOTHING;

-- City of London: the square mile (EC1 already went to Islington above, since
-- Angel/Clerkenwell reads more naturally as Islington for a cleaning service area)
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('EC2'), ('EC3'), ('EC4')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'City of London')
ON CONFLICT (prefix) DO NOTHING;

-- Camden was thin (only NW1/NW3/NW5) - add Highgate and Bloomsbury
INSERT INTO public.postcode_prefixes (prefix, borough_id, is_active)
SELECT p.prefix, b.id, true
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('N6'), ('WC1')) AS p(prefix)
WHERE b.name = 'General' AND b.region_id = (SELECT id FROM public.coverage_regions WHERE name = 'Camden')
ON CONFLICT (prefix) DO NOTHING;
