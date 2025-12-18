-- Add Essex region
INSERT INTO coverage_regions (name, display_order, is_active)
VALUES ('Essex', 50, true);

-- Add City of London region
INSERT INTO coverage_regions (name, display_order, is_active)
VALUES ('City of London', 5, true);

-- Add General borough for Essex
INSERT INTO coverage_boroughs (name, region_id, display_order, is_active)
SELECT 'General', id, 0, true
FROM coverage_regions WHERE name = 'Essex';

-- Add General borough for City of London
INSERT INTO coverage_boroughs (name, region_id, display_order, is_active)
SELECT 'General', id, 0, true
FROM coverage_regions WHERE name = 'City of London';

-- Add City of London postcodes (EC1-EC4 are the main City postcodes)
INSERT INTO postcode_prefixes (prefix, borough_id, is_active, domestic_cleaning, end_of_tenancy, airbnb_cleaning)
SELECT 'EC1', id, true, true, true, true
FROM coverage_boroughs WHERE name = 'General' AND region_id = (SELECT id FROM coverage_regions WHERE name = 'City of London');

INSERT INTO postcode_prefixes (prefix, borough_id, is_active, domestic_cleaning, end_of_tenancy, airbnb_cleaning)
SELECT 'EC2', id, true, true, true, true
FROM coverage_boroughs WHERE name = 'General' AND region_id = (SELECT id FROM coverage_regions WHERE name = 'City of London');

INSERT INTO postcode_prefixes (prefix, borough_id, is_active, domestic_cleaning, end_of_tenancy, airbnb_cleaning)
SELECT 'EC3', id, true, true, true, true
FROM coverage_boroughs WHERE name = 'General' AND region_id = (SELECT id FROM coverage_regions WHERE name = 'City of London');

INSERT INTO postcode_prefixes (prefix, borough_id, is_active, domestic_cleaning, end_of_tenancy, airbnb_cleaning)
SELECT 'EC4', id, true, true, true, true
FROM coverage_boroughs WHERE name = 'General' AND region_id = (SELECT id FROM coverage_regions WHERE name = 'City of London');