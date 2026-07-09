import type { CleanerData } from '@/api/cleaners';

export type { CleanerData };

export const toggleSelectionKey = (
  keys: string[],
  setKeys: (keys: string[]) => void,
  key: string
) => {
  setKeys(keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]);
};

export function applyCleanersListFilters(cleaners: CleanerData[], searchTerm: string): CleanerData[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return cleaners;

  return cleaners.filter(
    (cleaner) =>
      cleaner.first_name?.toLowerCase().includes(term) ||
      cleaner.last_name?.toLowerCase().includes(term) ||
      cleaner.email?.toLowerCase().includes(term) ||
      cleaner.phone?.toString().includes(term) ||
      cleaner.id.toString().includes(term)
  );
}

export const createEmptyNewCleanerData = () => ({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  postcode: '',
  hourly_rate: 20,
  presentage_rate: 70,
  services: '',
  years: 0,
  DBS: 'No',
  DBS_date: '',
  has_equipment: true,
});
