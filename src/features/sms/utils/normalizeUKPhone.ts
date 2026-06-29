/** Normalize UK phone numbers for fuzzy database matching. */
export function normalizeUKPhone(phone: string): string[] {
  const digitsOnly = phone.replace(/\D/g, '');
  const last10 = digitsOnly.slice(-10);

  return [last10, `44${last10}`, `0${last10.slice(1)}`];
}
