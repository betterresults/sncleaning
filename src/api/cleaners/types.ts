export interface CleanerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: number;
  address: string;
  postcode: string;
  hourly_rate: number;
  presentage_rate: number;
  services: string;
  years: number;
  rating: number;
  reviews: number;
  cleans_number: number;
  DBS: string;
  DBS_date: string;
  has_account?: boolean;
  has_equipment?: boolean;
}

export interface NewCleanerInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  postcode: string;
  hourly_rate: number;
  presentage_rate: number;
  services: string;
  years: number;
  DBS: string;
  DBS_date: string;
  has_equipment: boolean;
}

export interface UpdateCleanerInput {
  cleanerId: number;
  data: Partial<CleanerData>;
  serviceTypeKeys: string[];
  areaIds: string[];
}

export interface CreateCleanerInput {
  cleaner: Omit<NewCleanerInput, 'password'>;
  password?: string;
  serviceTypeKeys: string[];
  areaIds: string[];
}
