import { Check, CheckCheck } from 'lucide-react';
import type { SMSConversation } from '../types';
import { formatMessageTime } from '../utils/display';

interface SMSMessageBubbleProps {
  message: SMSConversation;
}

export function SMSMessageBubble({ message }: SMSMessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing';

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isOutgoing ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 ${
            isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          <span className="text-xs">{formatMessageTime(message.created_at)}</span>
          {isOutgoing &&
            (message.status === 'delivered' ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            ))}
        </div>
      </div>
    </div>
  );
}
