import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ModernUsersTable from '@/components/ModernUsersTable';
import { ShellPage } from '@/layouts/shell';

const UsersCustomers = () => {
  const [searchParams] = useSearchParams();
  const openCustomerId = Number.parseInt(searchParams.get('customerId') || '', 10);
  const customerId = Number.isFinite(openCustomerId) ? openCustomerId : undefined;

  return (
    <ShellPage width="wide">
      <ModernUsersTable userType="customer" openCustomerId={customerId} />
    </ShellPage>
  );
};

export default UsersCustomers;