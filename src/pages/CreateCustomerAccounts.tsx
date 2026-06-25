import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreateCleanerUsersUtility from '@/components/admin/CreateCleanerUsersUtility';
import { BulkCreateAccountsDialog } from '@/components/admin/BulkCreateAccountsDialog';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CreateCustomerAccounts = () => {
  const { user, userRole, signOut } = useAuth();

  const isSalesAgent = userRole === 'sales_agent';

  return (
    <ShellPage width="wide">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold">Customer Account Management</h1>
                  {!isSalesAgent && <BulkCreateAccountsDialog />}
                </div>
                <CreateCleanerUsersUtility readOnly={isSalesAgent} />
              </ShellPage>
  );
};

export default CreateCustomerAccounts;