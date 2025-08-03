import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import CreateCustomerDialog from "@/components/booking/CreateCustomerDialog";
import CreateCleanerDialog from "@/components/booking/CreateCleanerDialog";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Cleaner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  hourly_rate: number;
}

interface Address {
  id: string;
  address: string;
  postcode: string;
  access: string;
  is_default: boolean;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export default function AddRecurringBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateCleaner, setShowCreateCleaner] = useState(false);

  const [formData, setFormData] = useState({
    client: '',
    address: '',
    cleaner: '',
    cleaner_rate: '',
    cleaning_type: '',
    frequently: '',
    days: '',
    days_number: '',
    days_of_the_week: '',
    hours: '',
    cost_per_hour: '',
    total_cost: '',
    payment_method: '',
    start_date: '',
    start_time: '',
    postponed: false,
  });

  useEffect(() => {
    fetchCustomers();
    fetchCleaners();
    
    // Handle prefilled data from URL parameters
    const from = searchParams.get('from');
    if (from === 'booking') {
      const customerId = searchParams.get('customerId');
      const cleaningType = searchParams.get('cleaningType');
      const hours = searchParams.get('hours');
      const costPerHour = searchParams.get('costPerHour');
      const totalCost = searchParams.get('totalCost');
      const paymentMethod = searchParams.get('paymentMethod');
      const cleanerRate = searchParams.get('cleanerRate');
      const cleaner = searchParams.get('cleaner');
      
      setFormData(prev => ({
        ...prev,
        client: customerId || '',
        cleaning_type: cleaningType || 'Standard Cleaning',
        hours: hours || '2',
        cost_per_hour: costPerHour || '20',
        total_cost: totalCost || '40',
        payment_method: paymentMethod || 'Cash',
        cleaner_rate: cleanerRate || '16',
        cleaner: cleaner || ''
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (formData.client) {
      fetchAddresses(parseInt(formData.client));
    }
  }, [formData.client]);

  useEffect(() => {
    calculateTotalCost();
  }, [formData.hours, formData.cost_per_hour]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, email, hourly_rate')
        .order('first_name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const fetchAddresses = async (customerId: number) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const calculateTotalCost = () => {
    const hours = parseFloat(formData.hours) || 0;
    const costPerHour = parseFloat(formData.cost_per_hour) || 0;
    const total = hours * costPerHour;
    setFormData(prev => ({ ...prev, total_cost: total.toString() }));
  };

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId];
      
      setFormData(prevForm => ({
        ...prevForm,
        days_of_the_week: newDays.join(', '),
        days_number: newDays.length.toString()
      }));
      
      return newDays;
    });
  };

  const handleCleanerChange = (cleanerId: string) => {
    const cleaner = cleaners.find(c => c.id === parseInt(cleanerId));
    setFormData(prev => ({
      ...prev,
      cleaner: cleanerId,
      cleaner_rate: cleaner?.hourly_rate?.toString() || '',
      cost_per_hour: cleaner?.hourly_rate?.toString() || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        customer: parseInt(formData.client),
        address: formData.address,
        cleaner: formData.cleaner ? parseInt(formData.cleaner) : null,
        cleaner_rate: formData.cleaner_rate ? parseFloat(formData.cleaner_rate) : null,
        cleaning_type: formData.cleaning_type,
        frequently: formData.frequently,
        days_of_the_week: formData.days_of_the_week || null,
        hours: formData.hours || null,
        cost_per_hour: formData.cost_per_hour ? parseFloat(formData.cost_per_hour) : null,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
        payment_method: formData.payment_method,
        start_date: formData.start_date,
        start_time: formData.start_time,
        postponed: formData.postponed,
      };

      const { error } = await supabase
        .from('recurring_services')
        .insert([submitData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring booking created successfully",
      });

      navigate('/recurring-bookings');
    } catch (error) {
      console.error('Error creating recurring booking:', error);
      toast({
        title: "Error",
        description: "Failed to create recurring booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/recurring-bookings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recurring Bookings
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Recurring Booking</h1>
          <p className="text-muted-foreground">
            Create a new recurring cleaning service
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select or create a customer for this recurring booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="customer">Customer *</Label>
                <Select value={formData.client} onValueChange={(value) => setFormData(prev => ({ ...prev, client: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.first_name} {customer.last_name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateCustomer(true)}
                className="mt-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
            </div>

            {formData.client && (
              <div>
                <Label htmlFor="address">Address *</Label>
                <Select value={formData.address} onValueChange={(value) => setFormData(prev => ({ ...prev, address: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {address.address}, {address.postcode} {address.is_default && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>Configure the cleaning service parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cleaning_type">Service Type *</Label>
                <Select value={formData.cleaning_type} onValueChange={(value) => setFormData(prev => ({ ...prev, cleaning_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Cleaning">Standard Cleaning</SelectItem>
                    <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                    <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                    <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                    <SelectItem value="Post Construction">Post Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequently">Frequency *</Label>
                <Select value={formData.frequently} onValueChange={(value) => setFormData(prev => ({ ...prev, frequently: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.frequently === 'weekly' && (
              <div>
                <Label>Days of the Week *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={() => handleDayToggle(day.id)}
                      />
                      <Label htmlFor={day.id}>{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cleaner and Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Cleaner and Pricing</CardTitle>
            <CardDescription>Assign cleaner and set pricing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="cleaner">Cleaner</Label>
                <Select value={formData.cleaner} onValueChange={handleCleanerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cleaner" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaners.map((cleaner) => (
                      <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                        {cleaner.first_name} {cleaner.last_name} - £{cleaner.hourly_rate}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateCleaner(true)}
                className="mt-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Cleaner
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hours">Hours per Visit *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cost_per_hour">Cost per Hour *</Label>
                <Input
                  id="cost_per_hour"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_hour}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_hour: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_cost">Total Cost per Visit</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="BACS">BACS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/recurring-bookings')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Recurring Booking"}
          </Button>
        </div>
      </form>

      <CreateCustomerDialog
        onCustomerCreated={(customer) => {
          fetchCustomers();
          setFormData(prev => ({ ...prev, client: customer.id.toString() }));
          setShowCreateCustomer(false);
        }}
      >
        <Button 
          type="button" 
          variant="outline" 
          className="hidden"
          onClick={() => setShowCreateCustomer(true)}
        >
          Create Customer
        </Button>
      </CreateCustomerDialog>

      <CreateCleanerDialog
        onCleanerCreated={(cleaner) => {
          fetchCleaners();
          setFormData(prev => ({ ...prev, cleaner: cleaner.id.toString() }));
          setShowCreateCleaner(false);
        }}
      >
        <Button 
          type="button" 
          variant="outline" 
          className="hidden"
          onClick={() => setShowCreateCleaner(true)}
        >
          Create Cleaner
        </Button>
      </CreateCleanerDialog>
    </div>
  );
}