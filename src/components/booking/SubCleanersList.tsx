import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface SubCleaner {
  id: number;
  cleaner_id: number;
  payment_method: 'hourly' | 'percentage';
  hourly_rate: number | null;
  percentage_rate: number | null;
  hours_assigned: number;
  cleaner_pay: number;
  cleaner: {
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  };
}

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
  const [subCleaners, setSubCleaners] = useState<SubCleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingSubCleaner, setEditingSubCleaner] = useState<SubCleaner | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchSubCleaners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sub_bookings')
        .select(`
          *,
          cleaner:cleaners (
            first_name,
            last_name,
            full_name,
            email
          )
        `)
        .eq('primary_booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching sub-cleaners:', error);
        return;
      }

      // Type assertion to ensure payment_method is properly typed
      const typedData = (data || []).map(item => ({
        ...item,
        payment_method: item.payment_method as 'hourly' | 'percentage'
      }));

      setSubCleaners(typedData);
    } catch (error) {
      console.error('Error fetching sub-cleaners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCleaners();
  }, [bookingId]);

  const handleRemoveSubCleaner = async (subCleanerId: number) => {
    try {
      // Get the sub-cleaner hours before deletion
      const subCleanerToRemove = subCleaners.find(sc => sc.id === subCleanerId);
      const removedHours = subCleanerToRemove?.hours_assigned || 0;

      const { error } = await supabase
        .from('sub_bookings')
        .delete()
        .eq('id', subCleanerId);

      if (error) {
        console.error('Error removing sub-cleaner:', error);
        toast({
          title: "Error",
          description: "Failed to remove cleaner from booking",
          variant: "destructive",
        });
        return;
      }

      // Update primary cleaner's pay after removing sub-cleaner
      await updatePrimaryCleanerPayAfterRemoval(removedHours);

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
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    setDeleteId(null);
  };

  // Update primary cleaner's pay when a sub-cleaner is removed
  const updatePrimaryCleanerPayAfterRemoval = async (removedHours: number) => {
    try {
      // Get the current booking data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('cleaner, cleaner_rate, cleaner_percentage, total_cost, total_hours, cleaning_time')
        .eq('id', bookingId)
        .single();
      
      if (bookingError || !booking || !booking.cleaner) return;
      
      const totalHours = booking.total_hours || booking.cleaning_time || 0;
      
      // Calculate remaining sub-cleaner hours (excluding the removed one)
      const remainingSubCleanerHours = subCleaners
        .filter(sc => sc.hours_assigned !== removedHours || subCleaners.indexOf(sc) > 0)
        .reduce((sum, sc) => sum + (sc.hours_assigned || 0), 0) - removedHours;
      
      const primaryCleanerHours = Math.max(0, totalHours - Math.max(0, remainingSubCleanerHours));
      
      let newPrimaryCleanerPay: number;
      
      if (booking.cleaner_rate && booking.cleaner_rate > 0) {
        // Hourly rate
        newPrimaryCleanerPay = primaryCleanerHours * booking.cleaner_rate;
      } else if (booking.cleaner_percentage && booking.cleaner_percentage > 0) {
        // Percentage rate - calculate proportionally based on hours
        const hoursRatio = totalHours > 0 ? primaryCleanerHours / totalHours : 0;
        newPrimaryCleanerPay = (booking.total_cost || 0) * (booking.cleaner_percentage / 100) * hoursRatio;
      } else {
        // Default fallback - use hourly rate of 20
        newPrimaryCleanerPay = primaryCleanerHours * 20;
      }
      
      // Update the booking with new cleaner_pay
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ cleaner_pay: newPrimaryCleanerPay })
        .eq('id', bookingId);
      
      if (updateError) {
        console.error('Error updating primary cleaner pay:', updateError);
      }
    } catch (error) {
      console.error('Error updating primary cleaner pay:', error);
    }
  };

  const handleEditClick = (subCleaner: SubCleaner) => {
    setEditingSubCleaner(subCleaner);
    setEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    fetchSubCleaners();
    onSubCleanerUpdated?.();
  };

  // Calculate total pay for all sub-cleaners
  const totalSubCleanerPay = subCleaners.reduce((sum, sc) => sum + (sc.cleaner_pay || 0), 0);

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
                {subCleaner.cleaner.full_name || 
                 `${subCleaner.cleaner.first_name} ${subCleaner.cleaner.last_name}`}
              </span>
              <Badge variant="outline" className="text-xs">
                {subCleaner.payment_method === 'hourly' ? 'Hourly' : 'Percentage'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                £{subCleaner.cleaner_pay?.toFixed(2) || '0.00'}
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
                      {subCleaner.cleaner.full_name || 
                       `${subCleaner.cleaner.first_name} ${subCleaner.cleaner.last_name}`}
                    </span>
                    <Badge variant="outline">
                      {subCleaner.payment_method === 'hourly' ? 'Hourly' : 'Percentage'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {subCleaner.hours_assigned}h
                    </div>
                    <div className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      £{subCleaner.cleaner_pay?.toFixed(2) || '0.00'}
                    </div>
                    {subCleaner.payment_method === 'hourly' && (
                      <span>@ £{subCleaner.hourly_rate}/hour</span>
                    )}
                    {subCleaner.payment_method === 'percentage' && (
                      <span>{subCleaner.percentage_rate}% of total</span>
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
