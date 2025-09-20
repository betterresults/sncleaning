import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, MapPin, Clock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ChecklistWithBooking {
  id: string;
  booking_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  language_preference: 'english' | 'bulgarian';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  booking: {
    id: number;
    date_time: string;
    address: string;
    postcode: string;
    service_type: string;
    customer: number;
    customer_name?: string;
  };
}

export function CleanerChecklistsList() {
  const { userRole, cleanerId } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  const [checklists, setChecklists] = useState<ChecklistWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Determine effective cleaner ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;

  useEffect(() => {
    const fetchChecklists = async () => {
      if (!effectiveCleanerId) {
        setLoading(false);
        return;
      }

      try {
        // First, get checklists for the cleaner
        const { data: checklistsData, error: checklistsError } = await supabase
          .from('cleaning_checklists')
          .select(`
            id,
            booking_id,
            status,
            language_preference,
            created_at,
            updated_at,
            completed_at
          `)
          .eq('cleaner_id', effectiveCleanerId)
          .order('created_at', { ascending: false });

        if (checklistsError) throw checklistsError;

        if (!checklistsData || checklistsData.length === 0) {
          setChecklists([]);
          setLoading(false);
          return;
        }

        // Get booking data for each checklist
        const bookingIds = checklistsData.map(c => c.booking_id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            date_time,
            address,
            postcode,
            service_type,
            customer
          `)
          .in('id', bookingIds);

        if (bookingsError) throw bookingsError;

        // Get customer names
        const customerIds = [...new Set(bookingsData?.map(b => b.customer).filter(Boolean) || [])];
        let customersData: any[] = [];
        
        if (customerIds.length > 0) {
          const { data, error } = await supabase
            .from('customers')
            .select('id, first_name, last_name, email')
            .in('id', customerIds);
          
          if (!error) {
            customersData = data || [];
          }
        }

        // Combine data
        const combinedData: ChecklistWithBooking[] = checklistsData.map((checklist: any) => {
          const booking = bookingsData?.find(b => b.id === checklist.booking_id);
          const customer = customersData.find(c => c.id === booking?.customer);
          
          return {
            ...checklist,
            booking: {
              ...booking,
              customer_name: customer ? 
                `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email :
                'Unknown Customer'
            }
          };
        });

        setChecklists(combinedData);
      } catch (error) {
        console.error('Error fetching checklists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [effectiveCleanerId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <Check className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  const handleOpenChecklist = (bookingId: number) => {
    navigate(`/cleaner-checklist/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading checklists...</p>
        </div>
      </div>
    );
  }

  if (!effectiveCleanerId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Cleaner Selected</h3>
          <p className="text-muted-foreground">
            Please select a cleaner to view their checklists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (checklists.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Checklists Found</h3>
          <p className="text-muted-foreground">
            Checklists are automatically created for End of Tenancy bookings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cleaning Checklists</h2>
        <Badge variant="secondary">{checklists.length} Total</Badge>
      </div>

      <div className="grid gap-4">
        {checklists.map((checklist) => (
          <Card key={checklist.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{checklist.booking.service_type}</span>
                    {getStatusBadge(checklist.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(checklist.booking.date_time), 'PPP')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {checklist.booking.address}, {checklist.booking.postcode}
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Customer: </span>
                    <span className="font-medium">{checklist.booking.customer_name}</span>
                  </div>

                  {checklist.completed_at && (
                    <div className="text-sm text-green-600">
                      Completed on {format(new Date(checklist.completed_at), 'PPp')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={checklist.status === 'completed' ? 'outline' : 'default'}
                    onClick={() => handleOpenChecklist(checklist.booking.id)}
                  >
                    {checklist.status === 'completed' ? 'View Report' : 'Open Checklist'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}