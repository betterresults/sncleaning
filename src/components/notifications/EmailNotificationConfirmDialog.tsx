import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail } from "lucide-react";

interface EmailNotificationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  customerName?: string;
  emailType?: string;
}

export function EmailNotificationConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Send Email Notification?",
  description = "Would you like to send an email notification to the customer about this booking change?",
  customerName,
  emailType = "notification",
}: EmailNotificationConfirmDialogProps) {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{description}</p>
            {customerName && (
              <p className="text-sm font-medium">
                Customer: <span className="text-foreground">{customerName}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              You can always send notifications later from the Email Notifications management page.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            No, Don't Send
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Yes, Send Email
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}