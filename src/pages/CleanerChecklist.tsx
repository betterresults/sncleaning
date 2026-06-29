import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { CleaningChecklistInterface } from '@/components/cleaner/CleaningChecklistInterface';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerChecklist = () => {
  const { userRole, cleanerId, loading } = useAuth();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { selectedCleanerId } = useAdminCleaner();
  const [bookingData, setBookingData] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(true);
  const isAdminViewing = userRole === 'admin';

  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        setBookingLoading(false);
        return;
      }

      if (userRole === 'admin' && !selectedCleanerId) {
        setBookingLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            address,
            postcode,
            customer,
            date_time,
            service_type,
            cleaning_type,
            property_details,
            cleaner,
            total_cost
          `)
          .eq('id', parseInt(bookingId))
          .single();

        if (error) throw error;
        setBookingData(data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setBookingLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId, userRole, selectedCleanerId]);

  if (loading || bookingLoading) {
    return <ShellLoading message="Loading checklist..." />;
  }

  if (!bookingId || !bookingData) {
    return (
      <ShellPage width="wide">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Booking Selected</h3>
            <p className="text-muted-foreground">
              Please select a booking to view its cleaning checklist.
            </p>
          </CardContent>
        </Card>
      </ShellPage>
    );
  }

  if (!effectiveCleanerId) {
    return (
      <ShellPage width="wide">
        {isAdminViewing && <AdminCleanerSelector />}
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Cleaner Selected</h3>
            <p className="text-muted-foreground">
              Please select a cleaner to view their checklists.
            </p>
          </CardContent>
        </Card>
      </ShellPage>
    );
  }

  return (
    <ShellPage width="wide">
      {isAdminViewing && <AdminCleanerSelector />}
      <CleaningChecklistInterface
        bookingId={parseInt(bookingId)}
        cleanerId={effectiveCleanerId}
        bookingData={bookingData}
      />
    </ShellPage>
  );
};

export default CleanerChecklist;
