import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Navigate } from "react-router-dom";
import { Plus, Edit, Trash2, Calendar, User, MapPin, Pause, Play, Clock, Search, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation, salesAgentNavigation } from '@/lib/navigationItems';
import { PostponeDialog } from '@/components/recurringBookings/PostponeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  cleaner_rate: number;
  payment_method: string;
  days_of_the_week?: string;
  postponed: boolean;
  resume_date?: string;
}
export default function RecurringBookings() {
  const [recurringServices, setRecurringServices] = useState<RecurringService[]>([]);
  const [filteredServices, setFilteredServices] = useState<RecurringService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const navigate = useNavigate();
  const {
    user,
    userRole,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  // Allow admin and sales_agent
  if (!user || (userRole !== 'admin' && userRole !== 'sales_agent')) {
    return <Navigate to="/auth" replace />;
  }
  
  const navigation = userRole === 'sales_agent' ? salesAgentNavigation : adminNavigation;
  useEffect(() => {
    fetchRecurringServices();
  }, []);
  const fetchRecurringServices = async () => {
    try {
      // First, get the recurring services
      const {
        data: services,
        error: servicesError
      } = await supabase.from('recurring_services').select('*').order('start_date', {
        ascending: false
      });
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
      const {
        data: customers
      } = await supabase.from('customers').select('id, first_name, last_name').in('id', customerIds);

      // Fetch cleaners
      const {
        data: cleaners
      } = await supabase.from('cleaners').select('id, first_name, last_name').in('id', cleanerIds);

      // Fetch addresses
      const {
        data: addresses
      } = await supabase.from('addresses').select('id, address, postcode').in('id', addressIds);

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
      setFilteredServices(servicesWithNames);
    } catch (error) {
      console.error('Error fetching recurring services:', error);
      toast({
        title: "Error",
        description: "Failed to load recurring services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: number) => {
    try {
      const {
        error
      } = await supabase.from('recurring_services').delete().eq('id', id);
      if (error) throw error;
      setRecurringServices(prev => prev.filter(service => service.id !== id));
      toast({
        title: "Success",
        description: "Recurring service deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting recurring service:', error);
      toast({
        title: "Error",
        description: "Failed to delete recurring service",
        variant: "destructive"
      });
    }
  };
  // Filter services based on search and frequency
  useEffect(() => {
    let filtered = [...recurringServices];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.customer_name?.toLowerCase().includes(query) ||
        service.address?.toLowerCase().includes(query) ||
        service.cleaning_type?.toLowerCase().includes(query)
      );
    }

    // Apply frequency filter
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(service => 
        service.frequently?.toLowerCase() === frequencyFilter.toLowerCase()
      );
    }

    setFilteredServices(filtered);
  }, [recurringServices, searchQuery, frequencyFilter]);

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'weekly':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950/30 dark:text-green-400';
      case 'bi-weekly':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/30 dark:text-blue-400';
      case 'monthly':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };
  if (loading) {
    return <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gray-50">
          <UnifiedHeader title="" user={user} userRole={userRole} onSignOut={handleSignOut} />
          <div className="flex flex-1 w-full">
            <UnifiedSidebar navigationItems={navigation} user={user} userRole={userRole} onSignOut={handleSignOut} />
            <SidebarInset className="flex-1 flex flex-col p-0 m-0 overflow-x-hidden">
              <main className="flex-1 bg-gray-50 m-0 px-4 md:px-6 py-4 md:py-6 space-y-6 w-full">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading recurring services...</p>
                  </div>
                </div>
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader title="" user={user} userRole={userRole} onSignOut={handleSignOut} />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar navigationItems={navigation} user={user} userRole={userRole} onSignOut={handleSignOut} />
          <SidebarInset className="flex-1 flex flex-col p-0 m-0 overflow-x-hidden">
            <main className="flex-1 bg-gray-50 m-0 px-4 md:px-6 py-4 md:py-6 space-y-6 w-full">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header with Search and Filters */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by customer, address, or service..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="All Frequencies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Frequencies</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button onClick={() => navigate('/recurring-bookings/add')} className="flex items-center gap-2 whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Recurring Booking</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

      {filteredServices.length === 0 ? <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || frequencyFilter !== 'all' ? 'No matching bookings found' : 'No recurring bookings found'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || frequencyFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first recurring booking to get started'}
            </p>
            {!searchQuery && frequencyFilter === 'all' && (
              <Button onClick={() => navigate('/recurring-bookings/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recurring Booking
              </Button>
            )}
          </CardContent>
        </Card> : <div className="space-y-4">
          {filteredServices.map(service => (
            <div 
              key={service.id} 
              className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${
                service.postponed 
                  ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-orange-100 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800/30' 
                  : 'border-border/60 bg-gradient-to-br from-card to-card/80 hover:shadow-primary/5'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{service.cleaning_type}</h3>
                    <Badge className={getFrequencyBadgeColor(service.frequently)}>
                      {service.frequently === 'weekly' ? 'Weekly' : 
                       service.frequently === 'bi-weekly' ? 'Bi-Weekly' : 
                       service.frequently === 'monthly' ? 'Monthly' : 
                       service.frequently}
                    </Badge>
                    {service.postponed && (
                      <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                        <Pause className="h-3 w-3 mr-1" />
                        Postponed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">£{Number(service.total_cost).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">per visit</div>
                </div>
              </div>

              {/* Customer and Date Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">{service.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{service.address}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">
                      Starts {new Date(service.start_date).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })} at {service.start_time ? new Date(`2000-01-01T${service.start_time}`).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="font-medium">{service.hours}h per visit</span>
                  </div>
                </div>
                {service.days_of_the_week && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">
                      {service.days_of_the_week.split(', ').map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
                    </span>
                  </div>
                )}
                {service.postponed && service.resume_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Play className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="font-medium text-orange-700 dark:text-orange-400">
                      Resumes on {new Date(service.resume_date).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Info */}
              <div className="flex items-center justify-between pt-3 mb-3 border-t border-border/40">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cleaner: </span>
                    <span className="font-medium">{service.cleaner_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cleaner Pay: </span>
                    <span className="font-medium text-blue-600">£{(Number(service.cleaner_rate) * Number(service.hours)).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment: </span>
                    <span className="font-medium">{service.payment_method}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                <PostponeDialog serviceId={service.id} isPostponed={service.postponed} onUpdate={fetchRecurringServices}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={service.postponed 
                      ? "bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:text-green-400 dark:border-green-800/30" 
                      : "bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/30"
                    }
                  >
                    {service.postponed ? (
                      <>
                        <Play className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Postpone</span>
                      </>
                    )}
                  </Button>
                </PostponeDialog>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/recurring-bookings/edit/${service.id}`)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-950/20 dark:hover:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800/30"
                >
                  <Edit className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Edit</span>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800/30"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recurring Service</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this recurring service for {service.customer_name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(service.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>}
            </div>
          </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>;
}