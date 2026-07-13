import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Shield, UserCheck, UserPlus } from 'lucide-react';
import ModernUsersTable from '@/components/ModernUsersTable';
import { ShellPage, ShellSegment } from '@/layouts/shell';

const USER_TABS = [
  {
    value: 'customers',
    userType: 'customer' as const,
    label: 'Customers',
    shortLabel: 'Customers',
    icon: UserPlus,
  },
  {
    value: 'cleaners',
    userType: 'cleaner' as const,
    label: 'Cleaner logins',
    shortLabel: 'Logins',
    icon: UserCheck,
  },
  {
    value: 'office',
    userType: 'office' as const,
    label: 'Office Staff',
    shortLabel: 'Office',
    icon: Building2,
  },
  {
    value: 'admins',
    userType: 'admin' as const,
    label: 'Admins',
    shortLabel: 'Admins',
    icon: Shield,
  },
] as const;

type UserTabValue = (typeof USER_TABS)[number]['value'];

function isUserTab(value: string | null): value is UserTabValue {
  return USER_TABS.some((tab) => tab.value === value);
}

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: UserTabValue = isUserTab(tabParam) ? tabParam : 'customers';

  const activeConfig = useMemo(
    () => USER_TABS.find((tab) => tab.value === activeTab) ?? USER_TABS[0],
    [activeTab],
  );

  const handleTabChange = (value: string) => {
    if (!isUserTab(value)) return;
    setSearchParams(value === 'customers' ? {} : { tab: value }, { replace: true });
  };

  return (
    <ShellPage width="wide" className="!gap-8">
      <ShellSegment
        value={activeTab}
        onValueChange={handleTabChange}
        ariaLabel="User directory"
        options={USER_TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          shortLabel: tab.shortLabel,
          icon: tab.icon,
        }))}
      />

      <ModernUsersTable key={activeConfig.userType} userType={activeConfig.userType} />
    </ShellPage>
  );
};

export default Users;
