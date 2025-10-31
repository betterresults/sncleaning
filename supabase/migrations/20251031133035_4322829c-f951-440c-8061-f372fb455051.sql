-- Добавяне на липсващи Property Features (само ако не съществуват)
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Property Features', 'balconies', 'Balconies', 0, 'fixed', 15, '🌇', 0, 5, true, 5, 5
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Property Features' AND option = 'balconies');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Property Features', 'conservatory', 'Conservatory', 0, 'fixed', 20, '🪴', NULL, NULL, true, 6, 5
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Property Features' AND option = 'conservatory');

-- Linen Handling (само ако не съществува категорията)
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Linen Handling', 'customer-handles', 'I will handle linens', 0, 'fixed', 0, '👤', NULL, NULL, true, 1, 9
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Linen Handling' AND option = 'customer-handles');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Linen Handling', 'wash-hang', 'Wash and hang to dry', 0, 'fixed', 30, '🧺', NULL, NULL, true, 2, 9
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Linen Handling' AND option = 'wash-hang');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Linen Handling', 'wash-dry', 'Wash and tumble dry', 0, 'fixed', 60, '🌀', NULL, NULL, true, 3, 9
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Linen Handling' AND option = 'wash-dry');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Linen Handling', 'order-linens', 'Order linen packages', 0, 'fixed', 0, '📦', NULL, NULL, true, 4, 9
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Linen Handling' AND option = 'order-linens');

-- Ironing
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Ironing', 'none', 'No ironing needed', 0, 'fixed', 0, '➖', NULL, NULL, true, 1, 10
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Ironing' AND option = 'none');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Ironing', 'light', 'Light ironing', 10, 'fixed', 30, '👔', NULL, NULL, true, 2, 10
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Ironing' AND option = 'light');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Ironing', 'standard', 'Standard ironing', 15, 'fixed', 60, '👕', NULL, NULL, true, 3, 10
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Ironing' AND option = 'standard');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Ironing', 'heavy', 'Heavy ironing', 20, 'fixed', 90, '👗', NULL, NULL, true, 4, 10
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Ironing' AND option = 'heavy');

-- Time Flexibility
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Time Flexibility', 'flexible-time', 'Flexible with start time', 0, 'fixed', 0, '⏰', NULL, NULL, true, 1, 13
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Time Flexibility' AND option = 'flexible-time');

INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, min_value, max_value, is_visible, display_order, category_order)
SELECT 'Time Flexibility', 'not-flexible', 'Specific time required', 0, 'fixed', 0, '🕐', NULL, NULL, true, 2, 13
WHERE NOT EXISTS (SELECT 1 FROM airbnb_field_configs WHERE category = 'Time Flexibility' AND option = 'not-flexible');

-- Обновяване на Service Type опции да съответстват на PropertyStep
UPDATE airbnb_field_configs SET option = 'checkin-checkout' WHERE category = 'Service Type' AND option = 'check-in/out';
UPDATE airbnb_field_configs SET option = 'midstay' WHERE category = 'Service Type' AND option = 'mid-stay';