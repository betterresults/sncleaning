import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Loader2 } from 'lucide-react';

interface MessagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageType: 'email' | 'sms';
  recipientName: string;
  recipientContact: string;
  onSend: (editedMessage: string) => Promise<void>;
  loadMessage: () => Promise<string>;
}

const MessagePreviewDialog = ({
  open,
  onOpenChange,
  messageType,
  recipientName,
  recipientContact,
  onSend,
  loadMessage,
}: MessagePreviewDialogProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      loadMessage().then((msg) => {
        setMessage(msg);
        setIsLoading(false);
      }).catch((err) => {
        console.error('Error loading message:', err);
        setIsLoading(false);
      });
    }
  }, [open, loadMessage]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(message);
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {messageType === 'email' ? (
              <Mail className="h-5 w-5 text-primary" />
            ) : (
              <MessageSquare className="h-5 w-5 text-primary" />
            )}
            Preview & Edit {messageType === 'email' ? 'Email' : 'SMS'} Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              To: {recipientName}
            </Label>
            <p className="text-sm text-muted-foreground">
              {messageType === 'email' ? 'Email' : 'Phone'}: {recipientContact}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={messageType === 'email' ? 12 : 6}
                className="font-mono text-sm"
                placeholder={`Edit your ${messageType} message here...`}
              />
              <p className="text-xs text-muted-foreground">
                {messageType === 'sms' && `Character count: ${message.length}`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isLoading || !message.trim()}
          >
            {isSending ? 'Sending...' : `Send ${messageType === 'email' ? 'Email' : 'SMS'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessagePreviewDialog;
