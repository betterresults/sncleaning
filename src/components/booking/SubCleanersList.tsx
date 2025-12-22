import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, User, Clock, Banknote, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import EditSubCleanerDialog from './EditSubCleanerDialog';
import { 
  fetchAdditionalCleaners, 
  removeBookingCleaner, 
  recalculatePrimaryCleanerPay,
  BookingCleaner 
} from '@/hooks/useBookingCleaners';

interface SubCleanersListProps {
  bookingId: number;
  bookingTotalCost?: number;
  onSubCleanerRemoved?: () => void;
  onSubCleanerUpdated?: () => void;
  compact?: boolean;
}

const SubCleanersList = ({ 
  bookingId, 
  bookingTotalCost = 0,
  onSubCleanerRemoved, 
  onSubCleanerUpdated,
  compact = false 
}: SubCleanersListProps) => {
  const [subCleaners, setSubCleaners] = useState<BookingCleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSubCleaner, setEditingSubCleaner] = useState<BookingCleaner | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchSubCleaners = async () => {
    try {
      setLoading(true);
      const data = await fetchAdditionalCleaners(bookingId);
      setSubCleaners(data);
    } catch (error) {
      console.error('Error fetching sub-cleaners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCleaners();
  }, [bookingId]);

  const handleRemoveSubCleaner = async (subCleanerId: string) => {
    try {
      // Get the sub-cleaner hours before deletion
      const subCleanerToRemove = subCleaners.find(sc => sc.id === subCleanerId);
      const removedHours = subCleanerToRemove?.hours_assigned || 0;

      await removeBookingCleaner(subCleanerId);

      // Update primary cleaner's pay after removing sub-cleaner
      // Pass negative hours to indicate removal
      await recalculatePrimaryCleanerPay(bookingId, -removedHours);

      toast({
        title: "Success",
        description: "Cleaner removed from booking",
      });

      fetchSubCleaners();
      onSubCleanerRemoved?.();
    } catch (error) {
      console.error('Error removing sub-cleaner:', error);
      toast({
        title: "Error",
        description: "Failed to remove cleaner from booking",
        variant: "destructive",
      });
    }
    setDeleteId(null);
  };

  const handleEditClick = (subCleaner: BookingCleaner) => {
    setEditingSubCleaner(subCleaner);
    setEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    fetchSubCleaners();
    onSubCleanerUpdated?.();
  };

  // Calculate total pay for all sub-cleaners
  const totalSubCleanerPay = subCleaners.reduce((sum, sc) => sum + (sc.calculated_pay || 0), 0);

  const getPaymentMethodLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'hourly': return 'Hourly';
      case 'percentage': return 'Percentage';
      case 'fixed': return 'Fixed';
      default: return paymentType;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-muted-foreground">Loading additional cleaners...</div>
      </div>
    );
  }

  if (subCleaners.length === 0) {
    return null;
  }

  // Compact version for inline display
  if (compact) {
    return (
      <div className="space-y-2">
        {subCleaners.map((subCleaner) => (
          <div key={subCleaner.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {subCleaner.cleaner?.full_name || 
                 `${subCleaner.cleaner?.first_name} ${subCleaner.cleaner?.last_name}`}
              </span>
              <Badge variant="outline" className="text-xs">
                {getPaymentMethodLabel(subCleaner.payment_type)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                £{subCleaner.calculated_pay?.toFixed(2) || '0.00'}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleEditClick(subCleaner)}
                className="h-6 w-6"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteId(subCleaner.id)}
                className="h-6 w-6 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {subCleaners.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t text-sm">
            <span className="text-muted-foreground">Total Additional Pay:</span>
            <span className="font-semibold">£{totalSubCleanerPay.toFixed(2)}</span>
          </div>
        )}

        {/* Edit Dialog */}
        <EditSubCleanerDialog
          subCleaner={editingSubCleaner}
          bookingId={bookingId}
          bookingTotalCost={bookingTotalCost}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubCleanerUpdated={handleEditComplete}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Cleaner</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this cleaner from the booking? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleRemoveSubCleaner(deleteId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove Cleaner
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Full card version
  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Additional Cleaners ({subCleaners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subCleaners.map((subCleaner) => (
              <div key={subCleaner.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {subCleaner.cleaner?.full_name || 
                       `${subCleaner.cleaner?.first_name} ${subCleaner.cleaner?.last_name}`}
                    </span>
                    <Badge variant="outline">
                      {getPaymentMethodLabel(subCleaner.payment_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {subCleaner.hours_assigned && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {subCleaner.hours_assigned}h
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      £{subCleaner.calculated_pay?.toFixed(2) || '0.00'}
                    </div>
                    {subCleaner.payment_type === 'hourly' && subCleaner.hourly_rate && (
                      <span>@ £{subCleaner.hourly_rate}/hour</span>
                    )}
                    {subCleaner.payment_type === 'percentage' && subCleaner.percentage_rate && (
                      <span>{subCleaner.percentage_rate}% of total</span>
                    )}
                    {subCleaner.payment_type === 'fixed' && (
                      <span>Fixed amount</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(subCleaner)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteId(subCleaner.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {subCleaners.length > 0 && (
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-muted-foreground">Total Additional Pay:</span>
                <span className="font-semibold text-lg">£{totalSubCleanerPay.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditSubCleanerDialog
        subCleaner={editingSubCleaner}
        bookingId={bookingId}
        bookingTotalCost={bookingTotalCost}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubCleanerUpdated={handleEditComplete}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Cleaner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this cleaner from the booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleRemoveSubCleaner(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Cleaner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SubCleanersList;
