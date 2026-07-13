import { describe, expect, it } from 'vitest';
import { applyCleanersListFilters } from './types';
import type { CleanerData } from '@/api/cleaners';

const cleaners = [
  {
    id: 23,
    first_name: 'Test',
    last_name: 'Cleaner',
    email: 'testcleaner@sncleaningservices.co.uk',
    phone: 1234567890,
  },
  {
    id: 12,
    first_name: 'John',
    last_name: 'Cleaner',
    email: 'cleaner@test.com',
    phone: 111,
  },
  {
    id: 8,
    first_name: 'Ivelin',
    last_name: 'Tsochev',
    email: "ivo.test'gmail.com",
    phone: 222,
  },
] as CleanerData[];

describe('applyCleanersListFilters', () => {
  it('matches multi-word full names', () => {
    const result = applyCleanersListFilters(cleaners, 'Test Cleaner');
    expect(result.map((c) => c.id)).toEqual([23]);
  });

  it('matches single-token first name and email substrings containing that token', () => {
    const result = applyCleanersListFilters(cleaners, 'Test');
    expect(result.map((c) => c.id)).toEqual([23, 12, 8]);
  });

  it('matches last name only', () => {
    const result = applyCleanersListFilters(cleaners, 'Tsochev');
    expect(result.map((c) => c.id)).toEqual([8]);
  });

  it('matches email substrings', () => {
    const result = applyCleanersListFilters(cleaners, 'test.com');
    expect(result.map((c) => c.id)).toEqual([12]);
  });

  it('returns all cleaners for empty search', () => {
    expect(applyCleanersListFilters(cleaners, '   ')).toHaveLength(3);
  });
});
