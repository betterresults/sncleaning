import BulkLinkRecordsUtility from '@/components/admin/BulkLinkRecordsUtility';
import BulkAccountCreationUtility from '@/components/admin/BulkAccountCreationUtility';
import { DeleteUserByEmail } from '@/components/admin/DeleteUserByEmail';

export const UsersListStaffUtilities = () => (
  <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-4">
    <BulkAccountCreationUtility />
    <BulkLinkRecordsUtility />
    <DeleteUserByEmail />
  </div>
);
