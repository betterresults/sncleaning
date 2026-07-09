import { supabase } from '@/integrations/supabase/client';
import type { CleanerData, CreateCleanerInput, UpdateCleanerInput } from './types';

export async function saveCleanerServiceTypes(cleanerId: number, serviceTypeKeys: string[]) {
  const { error: deleteError } = await supabase
    .from('cleaner_service_types')
    .delete()
    .eq('cleaner_id', cleanerId);
  if (deleteError) throw deleteError;

  if (serviceTypeKeys.length > 0) {
    const { error: insertError } = await supabase
      .from('cleaner_service_types')
      .insert(serviceTypeKeys.map((key) => ({ cleaner_id: cleanerId, service_type_key: key })));
    if (insertError) throw insertError;
  }
}

export async function saveCleanerCoverageAreas(cleanerId: number, boroughIds: string[]) {
  const { error: deleteError } = await supabase
    .from('cleaner_coverage_areas')
    .delete()
    .eq('cleaner_id', cleanerId);
  if (deleteError) throw deleteError;

  if (boroughIds.length > 0) {
    const { error: insertError } = await supabase
      .from('cleaner_coverage_areas')
      .insert(boroughIds.map((boroughId) => ({ cleaner_id: cleanerId, borough_id: boroughId })));
    if (insertError) throw insertError;
  }
}

export async function updateCleanerRecord({
  cleanerId,
  data,
  serviceTypeKeys,
  areaIds,
}: UpdateCleanerInput) {
  const { error } = await supabase.from('cleaners').update(data).eq('id', cleanerId);
  if (error) throw error;

  await saveCleanerServiceTypes(cleanerId, serviceTypeKeys);
  await saveCleanerCoverageAreas(cleanerId, areaIds);
}

export async function deleteCleanerRecord(cleanerId: number) {
  const { error } = await supabase.from('cleaners').delete().eq('id', cleanerId);
  if (error) throw error;
}

export async function createCleanerRecord({
  cleaner,
  password,
  serviceTypeKeys,
  areaIds,
}: CreateCleanerInput): Promise<{ cleaner: CleanerData; accountCreated: boolean }> {
  const { data: cleanerData, error: cleanerError } = await supabase
    .from('cleaners')
    .insert({
      first_name: cleaner.first_name,
      last_name: cleaner.last_name,
      email: cleaner.email,
      phone: Number(cleaner.phone),
      address: cleaner.address,
      postcode: cleaner.postcode,
      hourly_rate: cleaner.hourly_rate,
      presentage_rate: cleaner.presentage_rate,
      services: cleaner.services,
      years: cleaner.years,
      DBS: cleaner.DBS,
      DBS_date: cleaner.DBS_date || null,
      has_equipment: cleaner.has_equipment,
      full_name: `${cleaner.first_name} ${cleaner.last_name}`.trim(),
      rating: 0,
      reviews: 0,
      cleans_number: 0,
    })
    .select()
    .single();

  if (cleanerError) throw cleanerError;

  if (serviceTypeKeys.length > 0) {
    await saveCleanerServiceTypes(cleanerData.id, serviceTypeKeys);
  }
  if (areaIds.length > 0) {
    await saveCleanerCoverageAreas(cleanerData.id, areaIds);
  }

  let accountCreated = false;
  if (password) {
    try {
      const { error: userError } = await supabase.functions.invoke('create-user', {
        body: {
          email: cleaner.email,
          password,
          firstName: cleaner.first_name,
          lastName: cleaner.last_name,
          role: 'user',
        },
      });
      if (userError) {
        console.error('Error creating user account:', userError);
      } else {
        accountCreated = true;
      }
    } catch (accountError) {
      console.error('Error creating account:', accountError);
    }
  }

  return { cleaner: cleanerData as CleanerData, accountCreated };
}
