import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Navigate } from "react-router-dom";
import { Plus, Edit, Trash2, Calendar, User, MapPin, Pause, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { PostponeDialog } from '@/components/recurringBookings/PostponeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecurringService {
  id: number;
  customer: number;
  customer_name?: string;
  address: string;
  cleaning_type: string;
  frequently: string;
  start_date: string;
  start_time: string;
  hours: string;
  cost_per_hour: number;
  total_cost: number;
  cleaner: number;
  cleaner_name?: string;
  payment_method: string;
  days_of_the_week?: string;
  postponed: boolean;
  resume_date?: string;
}

export default function RecurringBookings() {
  const [recurringServices, setRecurringServices] = useState<RecurringService[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchRecurringServices();
  }, []);

  const fetchRecurringServices = async () => {
    try {
      // First, get the recurring services
      const { data: services, error: servicesError } = await supabase
        .from('recurring_services')
        .select('*')
        .order('start_date', { ascending: false });

      if (servicesError) throw servicesError;

      if (!services || services.length === 0) {
        setRecurringServices([]);
        return;
      }

      // Get unique customer IDs, cleaner IDs, and address IDs
      const customerIds = [...new Set(services.map(s => s.customer).filter(Boolean))];
      const cleanerIds = [...new Set(services.map(s => s.cleaner).filter(Boolean))];
      const addressIds = [...new Set(services.map(s => s.address).filter(Boolean))];

      // Fetch customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .in('id', customerIds);

      // Fetch cleaners
      const { data: cleaners } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name')
        .in('id', cleanerIds);

      // Fetch addresses
      const { data: addresses } = await supabase
        .from('addresses')
        .select('id, address, postcode')
        .in('id', addressIds);

      // Create lookup maps
      const customersMap = new Map(customers?.map(c => [c.id, c]) || []);
      const cleanersMap = new Map(cleaners?.map(c => [c.id, c]) || []);
      const addressesMap = new Map(addresses?.map(a => [a.id, a]) || []);

      // Process the data with joined relationships
      const servicesWithNames = services.map((service: any) => {
        let customer_name = 'Unknown Customer';
        let cleaner_name = 'No Cleaner Assigned';
        let address_text = 'No Address';

        // Get customer name
        const customer = customersMap.get(service.customer);
        if (customer) {
          customer_name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }

        // Get cleaner name
        const cleaner = cleanersMap.get(service.cleaner);
        if (cleaner) {
          cleaner_name = `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim();
        }

        // Get address
        const address = addressesMap.get(service.address);
        if (address) {
          address_text = address.address;
        }

        return {
          ...service,
          customer_name,
          cleaner_name,
          address: address_text
        };
      });

      setRecurringServices(servicesWithNames);
    } catch (error) {
      console.error('Error fetching recurring services:', error);
      toast({
        title: "Error",
        description: "Failed to load recurring services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('recurring_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecurringServices(prev => prev.filter(service => service.id !== id));
      toast({
        title: "Success",
        description: "Recurring service deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting recurring service:', error);
      toast({
        title: "Error",
        description: "Failed to delete recurring service",
        variant: "destructive",
      });
    }
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'weekly':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'bi-weekly':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'monthly':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <UnifiedHeader 
              title="Recurring Bookings 🔄"
              user={user}
              userRole={userRole}
            />
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading recurring services...</p>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={adminNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Recurring Bookings 🔄"
            user={user}
            userRole={userRole}
          />
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Bookings</h1>
          <p className="text-muted-foreground">
            Manage recurring cleaning services and schedules
          </p>
        </div>
        <Button 
          onClick={() => navigate('/recurring-bookings/add')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Recurring Booking
        </Button>
      </div>

      {recurringServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recurring bookings found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first recurring booking to get started
            </p>
            <Button onClick={() => navigate('/recurring-bookings/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring Booking
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {recurringServices.map((service) => (
            <Card 
              key={service.id} 
              className={`hover:shadow-md transition-shadow ${
                service.postponed 
                  ? 'border-orange-200 bg-orange-50/50 shadow-sm' 
                  : 'hover:shadow-md'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {service.customer_name}
                      {service.postponed && (
                        <Badge variant="outline" className="ml-2 border-orange-300 text-orange-700 bg-orange-100">
                          <Pause className="h-3 w-3 mr-1" />
                          Postponed
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {service.address}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <PostponeDialog
                      serviceId={service.id}
                      isPostponed={service.postponed}
                      onUpdate={fetchRecurringServices}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className={service.postponed ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                      >
                        {service.postponed ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                    </PostponeDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/recurring-bookings/edit/${service.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Recurring Service</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this recurring service? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(service.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Service Details Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Service Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                        <p className="font-medium">{service.cleaning_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                        <Badge className={getFrequencyBadgeColor(service.frequently)}>
                          {service.frequently}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Hours per Visit</p>
                        <p className="font-medium">{service.hours}h</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(service.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                        <p className="font-medium">{service.start_time}</p>
                      </div>
                      {service.days_of_the_week && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Days of Week</p>
                          <p className="font-medium">{service.days_of_the_week.split(', ').map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}</p>
                        </div>
                      )}
                      {service.postponed && service.resume_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resume Date</p>
                          <p className="font-medium text-orange-700">{new Date(service.resume_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Pricing Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Client Pricing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Client Rate per Hour</p>
                        <p className="font-medium text-green-600">£{Number(service.cost_per_hour).toFixed(2)}/h</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Client Cost per Visit</p>
                        <p className="font-medium text-green-600 text-lg">£{Number(service.total_cost).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                        <p className="font-medium">{service.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cleaner Information Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Cleaner Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assigned Cleaner</p>
                        <p className="font-medium">{service.cleaner_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
              </div>
            )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}