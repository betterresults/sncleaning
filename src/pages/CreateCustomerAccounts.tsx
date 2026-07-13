import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreateCleanerUsersUtility from '@/components/admin/CreateCleanerUsersUtility';
import { BulkCreateAccountsDialog } from '@/components/admin/BulkCreateAccountsDialog';
import { ShellPage } from '@/layouts/shell';

const CreateCustomerAccounts = () => {
  const { userRole } = useAuth();

  const isSalesAgent = userRole === 'sales_agent';

  return (
    <ShellPage width="wide">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Account Utilities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create login accounts for cleaners, and bulk-create customer accounts.
          </p>
        </div>
        {!isSalesAgent && <BulkCreateAccountsDialog />}
      </div>
      <CreateCleanerUsersUtility readOnly={isSalesAgent} />
    </ShellPage>
  );
};

export default CreateCustomerAccounts;
