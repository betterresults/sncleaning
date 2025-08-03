-- Create missing address for Sarah Sawyer
INSERT INTO addresses (customer_id, address, postcode, access, is_default)
VALUES (8, '23a Christchurch Avenue', 'NW67QP', 'Front door', true)
ON CONFLICT DO NOTHING;