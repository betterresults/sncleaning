-- Create cleaning checklist templates table
CREATE TABLE public.cleaning_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  template_data JSONB NOT NULL, -- Contains room types and tasks structure
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaning checklists table
CREATE TABLE public.cleaning_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  cleaner_id BIGINT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.cleaning_checklist_templates(id),
  property_config JSONB NOT NULL, -- Room configuration (bedrooms: 2, bathrooms: 1, etc.)
  checklist_data JSONB NOT NULL DEFAULT '{}', -- Completed tasks and progress
  photos JSONB DEFAULT '[]', -- Array of photo objects with room/task associations
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  language_preference TEXT DEFAULT 'english' CHECK (language_preference IN ('english', 'bulgarian')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaning checklist photos table for better organization
CREATE TABLE public.cleaning_checklist_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.cleaning_checklists(id) ON DELETE CASCADE,
  room_section TEXT NOT NULL, -- e.g., "kitchen", "bedroom_1", "bathroom_1"
  file_path TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.cleaning_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_checklist_photos ENABLE ROW LEVEL SECURITY;

-- Templates policies (admin only)
CREATE POLICY "Admins can manage checklist templates" ON public.cleaning_checklist_templates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Checklists policies
CREATE POLICY "Cleaners can view their own checklists" ON public.cleaning_checklists
  FOR SELECT USING (
    cleaner_id IN (
      SELECT cleaner_id FROM profiles 
      WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
    )
  );

CREATE POLICY "Cleaners can update their own checklists" ON public.cleaning_checklists
  FOR UPDATE USING (
    cleaner_id IN (
      SELECT cleaner_id FROM profiles 
      WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
    )
  );

CREATE POLICY "Admins can manage all checklists" ON public.cleaning_checklists
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Photos policies
CREATE POLICY "Cleaners can manage photos for their checklists" ON public.cleaning_checklist_photos
  FOR ALL USING (
    checklist_id IN (
      SELECT id FROM cleaning_checklists 
      WHERE cleaner_id IN (
        SELECT cleaner_id FROM profiles 
        WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Admins can manage all checklist photos" ON public.cleaning_checklist_photos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.cleaning_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.cleaning_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default End of Tenancy template
INSERT INTO public.cleaning_checklist_templates (name, service_type, template_data) VALUES (
  'End of Tenancy Deep Clean',
  'End of Tenancy',
  '{
    "booked_services": [
      {"id": "end_of_tenancy", "en": "End of Tenancy Deep Clean", "bg": "Задълбочено почистване при освобождаване"},
      {"id": "carpet_cleaning", "en": "Professional Carpet Cleaning", "bg": "Професионално почистване на килими"},
      {"id": "mattress_cleaning", "en": "Mattress Cleaning", "bg": "Почистване на матраци"},
      {"id": "curtains_blinds", "en": "Curtains & blinds — hoovered & dusted only", "bg": "Завеси и щори — само прахосмукане и изтриване на прах"},
      {"id": "photo_evidence", "en": "Photo evidence attached separately", "bg": "Фото доказателства прикачени отделно"}
    ],
    "rooms": {
      "kitchen": {
        "name": {"en": "Kitchen", "bg": "Кухня"},
        "tasks": [
          {"id": "worktops", "en": "Worktops — cleaned & degreased", "bg": "Плотове — почистени и обезмаслени"},
          {"id": "cupboards", "en": "Cupboards — inside / outside / on top", "bg": "Шкафове — отвътре / отвън / отгоре"},
          {"id": "sink_taps", "en": "Sink & taps — cleaned & descaled", "bg": "Мивка и кранове — почистени и обезвъгляни"},
          {"id": "switches_sockets", "en": "Switches & sockets — wiped", "bg": "Ключове и контакти — избърсани"},
          {"id": "oven", "en": "Oven — in/out; trays, racks, hob", "bg": "Фурна — отвътре/отвън; тави, решетки, котлони"},
          {"id": "extractor", "en": "Extractor fan — wiped (filter where possible)", "bg": "Аспиратор — избърсан (филтър където е възможно)"},
          {"id": "fridge", "en": "Fridge/freezer — in/out; seals & drawers", "bg": "Хладилник/фризер — отвътре/отвън; уплътнения и чекмеджета"},
          {"id": "dishwasher", "en": "Dishwasher — inside/outside", "bg": "Съдомиялна — отвътре/отвън"},
          {"id": "washing_machine", "en": "Washing machine — drawer, seals, drum", "bg": "Пералня — чекмедже, уплътнения, барабан"},
          {"id": "dryer", "en": "Tumble dryer — drum & filter", "bg": "Сушилня — барабан и филтър"},
          {"id": "microwave", "en": "Microwave & small appliances — in/out", "bg": "Микровълнова и малки уреди — отвътре/отвън"},
          {"id": "windows_doors", "en": "Windows & sills; Doors & handles; Radiators; Light fittings", "bg": "Прозорци и перваци; Врати и дръжки; Радиатори; Осветителни тела"},
          {"id": "skirting", "en": "Skirting boards; Cobwebs removed", "bg": "Первази; Премахнати паяжини"},
          {"id": "floor", "en": "Floor — vacuumed; if hard, mopped", "bg": "Под — прахосмукан; ако е твърд, измит"}
        ]
      },
      "living_room": {
        "name": {"en": "Living Room", "bg": "Дневна"},
        "tasks": [
          {"id": "skirting_switches", "en": "Skirting boards; Switches & sockets; Doors & handles", "bg": "Первази; Ключове и контакти; Врати и дръжки"},
          {"id": "windows_radiators", "en": "Windows & sills; Radiators; Light fittings", "bg": "Прозорци и перваци; Радиатори; Осветителни тела"},
          {"id": "curtains", "en": "Curtains & pelmets — hoovered & dusted", "bg": "Завеси и ламбрекени — прахосмукани и почистени от прах"},
          {"id": "soft_furnishings", "en": "Soft furnishings — hoovered", "bg": "Меки мебели — прахосмукани"},
          {"id": "furniture", "en": "Furniture surfaces — wiped; Mirrors & glass — polished", "bg": "Повърхности на мебели — избърсани; Огледала и стъкла — полирани"},
          {"id": "carpets", "en": "Carpets — steam cleaned (if required)", "bg": "Килими — парно почистени (ако се изисква)"},
          {"id": "floor", "en": "Floor — vacuumed; if hard, mopped", "bg": "Под — прахосмукан; ако е твърд, измит"}
        ]
      },
      "bedroom": {
        "name": {"en": "Bedroom", "bg": "Спалня"},
        "tasks": [
          {"id": "skirting_switches", "en": "Skirting boards; Switches & sockets; Doors & handles", "bg": "Первази; Ключове и контакти; Врати и дръжки"},
          {"id": "windows_radiators", "en": "Windows & sills; Radiators; Light fittings", "bg": "Прозорци и перваци; Радиатори; Осветителни тела"},
          {"id": "curtains", "en": "Curtains & pelmets — hoovered & dusted", "bg": "Завеси и ламбрекени — прахосмукани и почистени от прах"},
          {"id": "wardrobes", "en": "Wardrobes & drawers — inside/outside", "bg": "Гардероби и чекмеджета — отвътре/отвън"},
          {"id": "mirrors", "en": "Mirrors & glass — polished", "bg": "Огледала и стъкла — полирани"},
          {"id": "carpets", "en": "Carpets — steam cleaned (if required)", "bg": "Килими — парно почистени (ако се изисква)"},
          {"id": "floor", "en": "Floor — vacuumed; if hard, mopped", "bg": "Под — прахосмукан; ако е твърд, измит"}
        ],
        "note": {"en": "Note: After mattress steam cleaning, mattresses are not wrapped so they can breathe and dry properly.", "bg": "Забележка: След парно почистване на матраците, те не се опаковат, за да могат да дишат и да изсъхнат правилно."}
      },
      "bathroom": {
        "name": {"en": "Bathroom", "bg": "Баня"},
        "tasks": [
          {"id": "bath_shower", "en": "Bath/shower/screen — cleaned & descaled", "bg": "Вана/душ/параван — почистени и обезвъгляни"},
          {"id": "toilet", "en": "Toilet — disinfected (in/out)", "bg": "Тоалетна — дезинфекцирана (отвътре/отвън)"},
          {"id": "sink_taps", "en": "Sink & taps — cleaned & descaled", "bg": "Мивка и кранове — почистени и обезвъгляни"},
          {"id": "tiles_mirrors", "en": "Tiles & grout — cleaned; Mirrors — polished", "bg": "Плочки и фуги — почистени; Огледала — полирани"},
          {"id": "extractor", "en": "Extractor fan — wiped (outside)", "bg": "Аспиратор — избърсан (отвън)"},
          {"id": "skirting_switches", "en": "Skirting boards; Switches & sockets; Doors & handles", "bg": "Первази; Ключове и контакти; Врати и дръжки"},
          {"id": "radiators_lights", "en": "Radiators; Light fittings; Cobwebs removed", "bg": "Радиатори; Осветителни тела; Премахнати паяжини"},
          {"id": "floor", "en": "Floor — vacuumed & mopped", "bg": "Под — прахосмукан и измит"}
        ]
      }
    }
  }'
);