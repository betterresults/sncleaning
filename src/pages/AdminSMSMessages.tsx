import { ShellPage } from '@/layouts/shell';
import { SMSMessagesView } from '@/features/sms';

const AdminSMSMessages = () => {
  return (
    <ShellPage width="wide" fill className="flex min-h-0 flex-col gap-3">
      <p className="text-sm text-muted-foreground shrink-0">
        Customer phone SMS via Twilio. In-app portal chat is under Messages → In-app Chat.
      </p>
      <div className="flex min-h-0 flex-1 flex-col">
        <SMSMessagesView />
      </div>
    </ShellPage>
  );
};

export default AdminSMSMessages;
