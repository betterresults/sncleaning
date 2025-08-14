import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, User, MapPin, Clock, Banknote, CalendarDays, Users } from "lucide-react";
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
    cleaner_assignment: 'unassigned', // 'unassigned' or 'assigned'
    cleaner_rate: '',
    cleaner_percentage: '70',
    payment_structure: 'hourly', // 'hourly' or 'percentage'
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
      const addressId = searchParams.get('addressId');
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
        address: addressId || '',
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
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/recurring-bookings')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Recurring Booking</h1>
          <p className="text-muted-foreground">Set up a new recurring cleaning service</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Customer Information</CardTitle>
                <CardDescription>Select or add a customer for this recurring service</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="customer" className="text-sm font-medium">Customer *</Label>
                <Select value={formData.client} onValueChange={(value) => setFormData(prev => ({ ...prev, client: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.first_name} {customer.last_name}</span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateCustomer(true)}
                className="mt-6 shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>

            {formData.client && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">Service Address *</Label>
                  <Select value={formData.address} onValueChange={(value) => setFormData(prev => ({ ...prev, address: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service address" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{address.address}, {address.postcode}</span>
                            {address.is_default && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Default</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service & Schedule */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Service & Schedule</CardTitle>
                <CardDescription>Configure service type and recurring schedule</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Service Type *</Label>
                <Select value={formData.cleaning_type} onValueChange={(value) => setFormData(prev => ({ ...prev, cleaning_type: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose service type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="Standard Cleaning">Standard Cleaning</SelectItem>
                    <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                    <SelectItem value="End of Tenancy">End of Tenancy</SelectItem>
                    <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                    <SelectItem value="Post Construction">Post Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Frequency *</Label>
                <Select value={formData.frequently} onValueChange={(value) => setFormData(prev => ({ ...prev, frequently: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.frequently === 'weekly' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Days of the Week *</Label>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2 p-2 rounded-md border border-border/50 hover:bg-accent/50 transition-colors">
                      <Checkbox
                        id={day.id}
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={() => handleDayToggle(day.id)}
                      />
                      <Label htmlFor={day.id} className="text-xs font-medium">{day.label.slice(0, 3)}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Start Time *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cleaner Assignment */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Cleaner Assignment</CardTitle>
                <CardDescription>Assign a cleaner or leave unassigned</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cleaner Assignment</Label>
              <RadioGroup 
                value={formData.cleaner_assignment} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  cleaner_assignment: value, 
                  cleaner: value === 'unassigned' ? '' : prev.cleaner 
                }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="unassigned" id="unassigned" />
                  <Label htmlFor="unassigned" className="flex-1 font-medium">Leave Unassigned</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="assigned" id="assigned" />
                  <Label htmlFor="assigned" className="flex-1 font-medium">Assign Cleaner</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.cleaner_assignment === 'assigned' && (
              <>
                <Separator />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Select Cleaner *</Label>
                    <Select value={formData.cleaner} onValueChange={handleCleanerChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a cleaner" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border">
                        {cleaners.map((cleaner) => (
                          <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{cleaner.first_name} {cleaner.last_name}</span>
                              <span className="text-xs text-muted-foreground">£{cleaner.hourly_rate}/hr</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateCleaner(true)}
                    className="mt-6 shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>

                {formData.cleaner && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Cleaner Payment Structure</Label>
                        <RadioGroup 
                          value={formData.payment_structure} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, payment_structure: value }))}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                        >
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly" className="flex-1 font-medium">Hourly Rate</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value="percentage" id="percentage" />
                            <Label htmlFor="percentage" className="flex-1 font-medium">Percentage of Total</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.payment_structure === 'hourly' ? (
                          <div>
                            <Label className="text-sm font-medium">Hourly Rate (£) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.cleaner_rate}
                              onChange={(e) => setFormData(prev => ({ ...prev, cleaner_rate: e.target.value }))}
                              className="mt-1"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <Label className="text-sm font-medium">Percentage (%) *</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.cleaner_percentage}
                              onChange={(e) => setFormData(prev => ({ ...prev, cleaner_percentage: e.target.value }))}
                              className="mt-1"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Pricing & Payment</CardTitle>
                <CardDescription>Set service pricing and payment method</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Hours per Visit *</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Rate per Hour (£) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_hour}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_hour: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Total per Visit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  readOnly
                  className="mt-1 bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Payment Method *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="How will you be paid?" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/recurring-bookings')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[160px]">
            {loading ? "Creating..." : "Create Recurring Booking"}
          </Button>
        </div>
      </form>

      {/* Hidden dialogs */}
      {showCreateCustomer && (
        <CreateCustomerDialog
          onCustomerCreated={(customer) => {
            fetchCustomers();
            setFormData(prev => ({ ...prev, client: customer.id.toString() }));
            setShowCreateCustomer(false);
          }}
        >
          <div className="hidden" />
        </CreateCustomerDialog>
      )}

      {showCreateCleaner && (
        <CreateCleanerDialog
          onCleanerCreated={(cleaner) => {
            fetchCleaners();
            setFormData(prev => ({ ...prev, cleaner: cleaner.id.toString() }));
            setShowCreateCleaner(false);
          }}
        >
          <div className="hidden" />
        </CreateCleanerDialog>
      )}
    </div>
  );
}