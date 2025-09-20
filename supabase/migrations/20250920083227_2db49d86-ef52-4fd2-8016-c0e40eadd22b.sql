-- Update the End of Tenancy template to match the PDF structure exactly
UPDATE cleaning_checklist_templates 
SET template_data = '{
  "booked_services": [
    {
      "id": "end_of_tenancy",
      "en": "End of Tenancy Deep Clean",
      "bg": "Задълбочено почистване при освобождаване"
    },
    {
      "id": "carpet_cleaning", 
      "en": "Professional Carpet Cleaning",
      "bg": "Професионално почистване на килими"
    },
    {
      "id": "mattress_cleaning",
      "en": "Mattress Cleaning",
      "bg": "Почистване на матраци"
    },
    {
      "id": "curtains_blinds",
      "en": "Curtains & blinds — hoovered & dusted only",
      "bg": "Завеси и щори — само прахосмукане и изтриване на прах"
    },
    {
      "id": "photo_evidence",
      "en": "Photo evidence attached separately", 
      "bg": "Фото доказателства прикачени отделно"
    }
  ],
  "rooms": {
    "kitchen": {
      "name": {
        "en": "Kitchen",
        "bg": "Кухня"
      },
      "tasks": [
        {
          "id": "worktops",
          "en": "Worktops — cleaned & degreased",
          "bg": "Плотове — почистени и обезмаслени"
        },
        {
          "id": "cupboards", 
          "en": "Cupboards — inside / outside / on top",
          "bg": "Шкафове — отвътре / отвън / отгоре"
        },
        {
          "id": "sink_taps",
          "en": "Sink & taps — cleaned & descaled", 
          "bg": "Мивка и кранове — почистени и обезвъгляни"
        },
        {
          "id": "switches_sockets",
          "en": "Switches & sockets — wiped",
          "bg": "Ключове и контакти — избърсани"
        },
        {
          "id": "oven",
          "en": "Oven — in/out; trays, racks, hob",
          "bg": "Фурна — отвътре/отвън; тави, решетки, котлони"
        },
        {
          "id": "extractor",
          "en": "Extractor fan — wiped (filter where possible)",
          "bg": "Аспиратор — избърсан (филтър където е възможно)"
        },
        {
          "id": "fridge",
          "en": "Fridge/freezer — in/out; seals & drawers",
          "bg": "Хладилник/фризер — отвътре/отвън; уплътнения и чекмеджета"
        },
        {
          "id": "dishwasher",
          "en": "Dishwasher — inside/outside", 
          "bg": "Съдомиялна — отвътре/отвън"
        },
        {
          "id": "washing_machine",
          "en": "Washing machine — drawer, seals, drum",
          "bg": "Пералня — чекмедже, уплътнения, барабан"
        },
        {
          "id": "dryer",
          "en": "Tumble dryer — drum & filter",
          "bg": "Сушилня — барабан и филтър"
        },
        {
          "id": "microwave",
          "en": "Microwave & small appliances — in/out",
          "bg": "Микровълнова и малки уреди — отвътре/отвън"
        },
        {
          "id": "windows_doors",
          "en": "Windows & sills; Doors & handles; Radiators; Light fittings",
          "bg": "Прозорци и перваци; Врати и дръжки; Радиатори; Осветителни тела"
        },
        {
          "id": "skirting_cobwebs",
          "en": "Skirting boards; Cobwebs removed",
          "bg": "Первази; Премахнати паяжини"
        },
        {
          "id": "floor",
          "en": "Floor — vacuumed; if hard, mopped",
          "bg": "Под — прахосмукан; ако е твърд, измит"
        }
      ]
    },
    "living_room": {
      "name": {
        "en": "Living Room",
        "bg": "Дневна"
      },
      "tasks": [
        {
          "id": "skirting_switches",
          "en": "Skirting boards; Switches & sockets; Doors & handles", 
          "bg": "Первази; Ключове и контакти; Врати и дръжки"
        },
        {
          "id": "windows_radiators",
          "en": "Windows & sills; Radiators; Light fittings",
          "bg": "Прозорци и перваци; Радиатори; Осветителни тела"
        },
        {
          "id": "curtains",
          "en": "Curtains & pelmets — hoovered & dusted",
          "bg": "Завеси и ламбрекени — прахосмукани и почистени от прах"
        },
        {
          "id": "soft_furnishings",
          "en": "Soft furnishings — hoovered", 
          "bg": "Меки мебели — прахосмукани"
        },
        {
          "id": "furniture_mirrors",
          "en": "Furniture surfaces — wiped; Mirrors & glass — polished",
          "bg": "Повърхности на мебелите — избърсани; Огледала и стъкла — полирани"
        },
        {
          "id": "carpets",
          "en": "Carpets — steam cleaned (if required)",
          "bg": "Килими — парно почистени (ако се изисква)"
        },
        {
          "id": "floor",
          "en": "Floor — vacuumed; if hard, mopped",
          "bg": "Под — прахосмукан; ако е твърд, измит"
        }
      ]
    },
    "bedroom": {
      "name": {
        "en": "Bedroom",
        "bg": "Спалня"
      },
      "tasks": [
        {
          "id": "skirting_switches",
          "en": "Skirting boards; Switches & sockets; Doors & handles",
          "bg": "Первази; Ключове и контакти; Врати и дръжки"
        },
        {
          "id": "windows_radiators", 
          "en": "Windows & sills; Radiators; Light fittings",
          "bg": "Прозорци и перваци; Радиатори; Осветителни тела"
        },
        {
          "id": "curtains",
          "en": "Curtains & pelmets — hoovered & dusted",
          "bg": "Завеси и ламбрекени — прахосмукани и почистени от прах"
        },
        {
          "id": "wardrobes",
          "en": "Wardrobes & drawers — inside/outside",
          "bg": "Гардероби и чекмеджета — отвътре/отвън"
        },
        {
          "id": "mirrors",
          "en": "Mirrors & glass — polished",
          "bg": "Огледала и стъкла — полирани"
        },
        {
          "id": "carpets",
          "en": "Carpets — steam cleaned (if required)",
          "bg": "Килими — парно почистени (ако се изисква)"
        },
        {
          "id": "floor",
          "en": "Floor — vacuumed; if hard, mopped", 
          "bg": "Под — прахосмукан; ако е твърд, измит"
        }
      ],
      "note": {
        "en": "Note: After mattress steam cleaning, mattresses are not wrapped so they can breathe and dry properly.",
        "bg": "Забележка: След парно почистване на матраците, те не се опаковат, за да могат да дишат и да изсъхнат правилно."
      }
    },
    "bathroom": {
      "name": {
        "en": "Bathroom", 
        "bg": "Баня"
      },
      "tasks": [
        {
          "id": "bath_shower",
          "en": "Bath/shower/screen — cleaned & descaled",
          "bg": "Вана/душ/параван — почистени и обезвъгляни"
        },
        {
          "id": "toilet",
          "en": "Toilet — disinfected (in/out)",
          "bg": "Тоалетна — дезинфекцирана (отвътре/отвън)"
        },
        {
          "id": "sink_taps",
          "en": "Sink & taps — cleaned & descaled",
          "bg": "Мивка и кранове — почистени и обезвъгляни"
        },
        {
          "id": "tiles_mirrors",
          "en": "Tiles & grout — cleaned; Mirrors — polished",
          "bg": "Плочки и фуги — почистени; Огледала — полирани"
        },
        {
          "id": "extractor",
          "en": "Extractor fan — wiped (outside)",
          "bg": "Аспиратор — избърсан (отвън)"
        },
        {
          "id": "skirting_switches",
          "en": "Skirting boards; Switches & sockets; Doors & handles",
          "bg": "Первази; Ключове и контакти; Врати и дръжки"
        },
        {
          "id": "radiators_lights",
          "en": "Radiators; Light fittings; Cobwebs removed",
          "bg": "Радиатори; Осветителни тела; Премахнати паяжини"
        },
        {
          "id": "floor",
          "en": "Floor — vacuumed & mopped",
          "bg": "Под — прахосмукан и измит"
        }
      ]
    }
  }
}'::jsonb
WHERE service_type = 'End of Tenancy' AND is_active = true;