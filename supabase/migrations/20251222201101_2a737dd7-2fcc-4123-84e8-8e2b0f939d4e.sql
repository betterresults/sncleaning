-- Create end_of_tenancy_field_configs table for pricing configuration
CREATE TABLE public.end_of_tenancy_field_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  option VARCHAR(100) NOT NULL,
  label VARCHAR(200),
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  time DECIMAL(10,2) DEFAULT 0,
  value_type VARCHAR(50) NOT NULL DEFAULT 'fixed',
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  category_order INTEGER DEFAULT 0,
  icon VARCHAR(100),
  min_value INTEGER DEFAULT 0,
  max_value INTEGER DEFAULT 99,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, option)
);

-- Enable RLS
ALTER TABLE public.end_of_tenancy_field_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for form)
CREATE POLICY "Allow public read access for end_of_tenancy_field_configs"
ON public.end_of_tenancy_field_configs
FOR SELECT
USING (true);

-- Create policy for admin write access
CREATE POLICY "Allow admin write access for end_of_tenancy_field_configs"
ON public.end_of_tenancy_field_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default pricing data

-- Base Pricing (bedrooms x bathrooms matrix)
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('base_price', 'studio_1', 'Studio, 1 Bathroom', 150, 3, 'fixed', 1, 1),
('base_price', 'studio_2', 'Studio, 2 Bathrooms', 170, 3.5, 'fixed', 2, 1),
('base_price', '1_1', '1 Bedroom, 1 Bathroom', 180, 4, 'fixed', 3, 1),
('base_price', '1_2', '1 Bedroom, 2 Bathrooms', 200, 4.5, 'fixed', 4, 1),
('base_price', '2_1', '2 Bedrooms, 1 Bathroom', 220, 5, 'fixed', 5, 1),
('base_price', '2_2', '2 Bedrooms, 2 Bathrooms', 250, 5.5, 'fixed', 6, 1),
('base_price', '2_3', '2 Bedrooms, 3 Bathrooms', 280, 6, 'fixed', 7, 1),
('base_price', '3_1', '3 Bedrooms, 1 Bathroom', 280, 6, 'fixed', 8, 1),
('base_price', '3_2', '3 Bedrooms, 2 Bathrooms', 310, 6.5, 'fixed', 9, 1),
('base_price', '3_3', '3 Bedrooms, 3 Bathrooms', 340, 7, 'fixed', 10, 1),
('base_price', '3_4', '3 Bedrooms, 4 Bathrooms', 370, 7.5, 'fixed', 11, 1),
('base_price', '4_1', '4 Bedrooms, 1 Bathroom', 340, 7, 'fixed', 12, 1),
('base_price', '4_2', '4 Bedrooms, 2 Bathrooms', 380, 7.5, 'fixed', 13, 1),
('base_price', '4_3', '4 Bedrooms, 3 Bathrooms', 420, 8, 'fixed', 14, 1),
('base_price', '4_4', '4 Bedrooms, 4 Bathrooms', 460, 8.5, 'fixed', 15, 1),
('base_price', '5_1', '5 Bedrooms, 1 Bathroom', 400, 8, 'fixed', 16, 1),
('base_price', '5_2', '5 Bedrooms, 2 Bathrooms', 450, 8.5, 'fixed', 17, 1),
('base_price', '5_3', '5 Bedrooms, 3 Bathrooms', 500, 9, 'fixed', 18, 1),
('base_price', '5_4', '5 Bedrooms, 4 Bathrooms', 550, 9.5, 'fixed', 19, 1),
('base_price', '5_5', '5 Bedrooms, 5 Bathrooms', 600, 10, 'fixed', 20, 1),
('base_price', '6+_1', '6+ Bedrooms, 1 Bathroom', 480, 9, 'fixed', 21, 1),
('base_price', '6+_2', '6+ Bedrooms, 2 Bathrooms', 550, 10, 'fixed', 22, 1),
('base_price', '6+_3', '6+ Bedrooms, 3 Bathrooms', 620, 11, 'fixed', 23, 1),
('base_price', '6+_4', '6+ Bedrooms, 4 Bathrooms', 690, 12, 'fixed', 24, 1),
('base_price', '6+_5', '6+ Bedrooms, 5 Bathrooms', 760, 13, 'fixed', 25, 1),
('base_price', '6+_6+', '6+ Bedrooms, 6+ Bathrooms', 830, 14, 'fixed', 26, 1);

-- Oven Cleaning
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('oven_cleaning', 'single', 'Single Oven', 45, 0.5, 'fixed', 1, 2),
('oven_cleaning', 'double', 'Double Oven', 65, 0.75, 'fixed', 2, 2),
('oven_cleaning', 'range', 'Range Cooker', 85, 1, 'fixed', 3, 2);

-- Blinds/Shutters
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('blinds', 'small', 'Small Blinds/Shutters', 6, 0.1, 'per_item', 1, 3),
('blinds', 'medium', 'Medium Blinds/Shutters', 9, 0.15, 'per_item', 2, 3),
('blinds', 'large', 'Large Blinds/Shutters', 12, 0.2, 'per_item', 3, 3);

-- Extra Services
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('extras', 'balcony', 'Balcony Cleaning', 30, 0.5, 'per_item', 1, 4),
('extras', 'waste', 'Household Waste Removal (per 10 bags)', 40, 0.5, 'per_item', 2, 4),
('extras', 'garage', 'Garage Cleaning', 50, 1, 'per_item', 3, 4);

-- Carpet Cleaning
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('carpet', 'rug_small', 'Small Rug', 29, 0.25, 'per_item', 1, 5),
('carpet', 'rug_medium', 'Medium Rug', 39, 0.35, 'per_item', 2, 5),
('carpet', 'rug_large', 'Large Rug', 59, 0.5, 'per_item', 3, 5),
('carpet', 'carpet_single_bedroom', 'Single Bedroom Carpet', 39, 0.35, 'per_item', 4, 5),
('carpet', 'carpet_double_bedroom', 'Double Bedroom Carpet', 59, 0.5, 'per_item', 5, 5),
('carpet', 'carpet_master_bedroom', 'Master Bedroom Carpet', 69, 0.6, 'per_item', 6, 5),
('carpet', 'carpet_lounge', 'Lounge Carpet', 79, 0.75, 'per_item', 7, 5),
('carpet', 'carpet_dining_room', 'Dining Room Carpet', 59, 0.5, 'per_item', 8, 5),
('carpet', 'stairs', 'Staircase', 49, 0.5, 'per_item', 9, 5),
('carpet', 'hallway', 'Hallway', 19, 0.2, 'per_item', 10, 5);

-- Upholstery Cleaning
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('upholstery', 'sofa_2seat', '2-Seater Sofa', 59, 0.5, 'per_item', 1, 6),
('upholstery', 'sofa_3seat', '3-Seater Sofa', 89, 0.75, 'per_item', 2, 6),
('upholstery', 'sofa_corner', 'Corner Sofa', 109, 1, 'per_item', 3, 6),
('upholstery', 'armchair', 'Armchair', 39, 0.35, 'per_item', 4, 6),
('upholstery', 'dining_chair', 'Dining Chair', 15, 0.15, 'per_item', 5, 6),
('upholstery', 'ottoman', 'Ottoman', 29, 0.25, 'per_item', 6, 6),
('upholstery', 'headboard', 'Headboard', 45, 0.4, 'per_item', 7, 6),
('upholstery', 'curtains_half', 'Curtains (Half)', 35, 0.35, 'per_item', 8, 6),
('upholstery', 'curtains_full', 'Curtains (Full)', 49, 0.5, 'per_item', 9, 6);

-- Mattress Cleaning
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('mattress', 'mattress_single', 'Single Mattress', 35, 0.35, 'per_item', 1, 7),
('mattress', 'mattress_double', 'Double Mattress', 45, 0.45, 'per_item', 2, 7),
('mattress', 'mattress_king', 'King Mattress', 55, 0.55, 'per_item', 3, 7),
('mattress', 'mattress_superking', 'Super King Mattress', 65, 0.65, 'per_item', 4, 7);

-- Additional Rooms
INSERT INTO public.end_of_tenancy_field_configs (category, option, label, value, time, value_type, display_order, category_order) VALUES
('additional_rooms', 'dining-room', 'Dining Room', 20, 0.5, 'fixed', 1, 8),
('additional_rooms', 'study', 'Study Room', 20, 0.5, 'fixed', 2, 8),
('additional_rooms', 'utility-room', 'Utility Room', 25, 0.5, 'fixed', 3, 8),
('additional_rooms', 'conservatory', 'Conservatory', 30, 0.75, 'fixed', 4, 8),
('additional_rooms', 'additional-living', 'Additional Living Room', 35, 0.75, 'fixed', 5, 8),
('additional_rooms', 'basement', 'Basement', 40, 1, 'fixed', 6, 8),
('additional_rooms', 'loft', 'Loft Room', 30, 0.75, 'fixed', 7, 8);

-- Create trigger for updated_at
CREATE TRIGGER update_end_of_tenancy_field_configs_updated_at
BEFORE UPDATE ON public.end_of_tenancy_field_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();