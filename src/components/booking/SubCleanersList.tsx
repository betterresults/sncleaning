
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, User, Clock, Banknote } from 'lucide-react';
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
  onSubCleanerRemoved?: () => void;
}

const SubCleanersList = ({ bookingId, onSubCleanerRemoved }: SubCleanersListProps) => {
  const [subCleaners, setSubCleaners] = useState<SubCleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
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

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Loading additional cleaners...</div>
      </div>
    );
  }

  if (subCleaners.length === 0) {
    return null;
  }

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
              <div key={subCleaner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
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
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteId(subCleaner.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              className="bg-red-600 hover:bg-red-700"
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
