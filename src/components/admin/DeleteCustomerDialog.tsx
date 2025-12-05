import { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    booking_count?: number;
  } | null;
  onDeleted: () => void;
}

export function DeleteCustomerDialog({ 
  open, 
  onOpenChange, 
  customer, 
  onDeleted 
}: DeleteCustomerDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedData, setRelatedData] = useState<{
    bookingsCount: number;
    pastBookingsCount: number;
    hasAuthAccount: boolean;
    addressesCount: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && customer) {
      fetchRelatedData();
    } else {
      setConfirmText('');
      setRelatedData(null);
    }
  }, [open, customer]);

  const fetchRelatedData = async () => {
    if (!customer) return;

    try {
      const [bookingsRes, pastBookingsRes, profileRes, addressesRes] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('customer', customer.id),
        supabase.from('past_bookings').select('*', { count: 'exact', head: true }).eq('customer', customer.id),
        supabase.from('profiles').select('user_id').eq('customer_id', customer.id).maybeSingle(),
        supabase.from('addresses').select('*', { count: 'exact', head: true }).eq('customer_id', customer.id)
      ]);

      setRelatedData({
        bookingsCount: bookingsRes.count || 0,
        pastBookingsCount: pastBookingsRes.count || 0,
        hasAuthAccount: !!profileRes.data?.user_id,
        addressesCount: addressesRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  const handleDelete = async () => {
    if (!customer || confirmText !== 'DELETE') return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-customer-cascade', {
        body: { customer_id: customer.id }
      });

      if (error) throw error;

      toast({
        title: "Customer deleted",
        description: `${customer.first_name} ${customer.last_name} and all related data have been deleted.`,
      });

      onDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!customer) return null;

  const customerName = `${customer.first_name} ${customer.last_name}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Customer
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to permanently delete <strong>{customerName}</strong> and all their related data.
              </p>
              
              {relatedData && (
                <div className="bg-destructive/10 p-3 rounded-lg text-sm space-y-1">
                  <p className="font-medium text-destructive">The following will be deleted:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Customer record</li>
                    {relatedData.bookingsCount > 0 && (
                      <li>{relatedData.bookingsCount} upcoming booking(s)</li>
                    )}
                    {relatedData.pastBookingsCount > 0 && (
                      <li>{relatedData.pastBookingsCount} past booking(s)</li>
                    )}
                    {relatedData.addressesCount > 0 && (
                      <li>{relatedData.addressesCount} saved address(es)</li>
                    )}
                    {relatedData.hasAuthAccount && (
                      <li>User login account</li>
                    )}
                    <li>Payment methods & history</li>
                    <li>Chat messages</li>
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
