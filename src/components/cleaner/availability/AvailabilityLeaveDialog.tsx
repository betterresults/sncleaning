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
} from '@/components/ui/alert-dialog';

interface AvailabilityLeaveDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

const AvailabilityLeaveDialog: React.FC<AvailabilityLeaveDialogProps> = ({ open, onStay, onLeave }) => (
  <AlertDialog open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
        <AlertDialogDescription>
          You have unsaved availability changes. Leave this page without saving and your edits will be lost.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onStay}>Keep editing</AlertDialogCancel>
        <AlertDialogAction onClick={onLeave}>Leave without saving</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default AvailabilityLeaveDialog;
