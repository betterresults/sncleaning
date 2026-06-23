/** Database / AuthContext role values */
export const ROLES = {
  ADMIN: 'admin',
  SALES_AGENT: 'sales_agent',
  CLEANER: 'user',
  CUSTOMER: 'guest',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Human-readable labels for UI copy */
export const ROLE_LABELS: Record<AppRole, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SALES_AGENT]: 'Sales Agent',
  [ROLES.CLEANER]: 'Cleaner',
  [ROLES.CUSTOMER]: 'Customer',
};

export const ALL_AUTHENTICATED_ROLES: AppRole[] = [
  ROLES.ADMIN,
  ROLES.SALES_AGENT,
  ROLES.CLEANER,
  ROLES.CUSTOMER,
];

export const STAFF_ROLES: AppRole[] = [ROLES.ADMIN, ROLES.SALES_AGENT];

export function isAppRole(value: string | null | undefined): value is AppRole {
  return ALL_AUTHENTICATED_ROLES.includes(value as AppRole);
}
