import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CreateCleanerUsersUtility from '@/components/admin/CreateCleanerUsersUtility';
import { BulkCreateAccountsDialog } from '@/components/admin/BulkCreateAccountsDialog';

const CreateCustomerAccounts = () => {
  const { user, userRole, signOut } = useAuth();

  const isSalesAgent = userRole === 'sales_agent';

  return (
<div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold">Customer Account Management</h1>
                  {!isSalesAgent && <BulkCreateAccountsDialog />}
                </div>
                <CreateCleanerUsersUtility readOnly={isSalesAgent} />
              </div>
  );
};

export default CreateCustomerAccounts;