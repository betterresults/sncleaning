import { ShellPage } from '@/layouts/shell';
import { SMSMessagesView } from '@/features/sms';

const AdminSMSMessages = () => {
  return (
    <ShellPage width="wide">
      <SMSMessagesView />
    </ShellPage>
  );
};

export default AdminSMSMessages;
