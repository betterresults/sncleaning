-- Remove unwanted notes and services from End of Tenancy template
UPDATE cleaning_checklist_templates 
SET template_data = jsonb_set(
  jsonb_set(
    template_data,
    '{booked_services}',
    (
      SELECT jsonb_agg(service)
      FROM jsonb_array_elements(template_data->'booked_services') AS service
      WHERE service->>'id' != 'curtains_blinds'
    )
  ),
  '{rooms,bedroom}',
  jsonb_set(
    template_data->'rooms'->'bedroom',
    '{note}',
    'null'::jsonb
  ) - 'note'
)
WHERE service_type = 'End of Tenancy' AND is_active = true;