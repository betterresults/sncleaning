import { ShellPage } from '@/layouts/shell';
import { SMSMessagesView } from '@/features/sms';

const AdminSMSMessages = () => {
  return (
    <ShellPage width="wide" fill className="flex min-h-0 flex-col">
      <SMSMessagesView />
    </ShellPage>
  );
};

export default AdminSMSMessages;
