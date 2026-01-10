import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, User, Clock, Banknote, CalendarDays, CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import CreateCustomerDialog from "@/components/booking/CreateCustomerDialog";
import CreateCleanerDialog from "@/components/booking/CreateCleanerDialog";
import { useServiceTypes, useCleaningTypes, usePaymentMethods } from "@/hooks/useCompanySettings";
import { useLinkedCleaners } from "@/hooks/useLinkedCleaners";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  
  // Fetch dynamic service types, cleaning types, and payment methods
  const { data: serviceTypes } = useServiceTypes();
  const { data: cleaningTypes } = useCleaningTypes();
  const { data: paymentMethods } = usePaymentMethods();

  const [formData, setFormData] = useState({
    client: '',
    address: '',
    cleaner: '',
    cleaner_assignment: 'unassigned',
    cleaner_rate: '',
    cleaner_percentage: '70',
    payment_structure: 'hourly',
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
    confirmed: false, // New field for pre-confirming recurring services
    recurringGroupId: null as string | null,
  });

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ['00', '30'];
  const periods = ['AM', 'PM'];

  useEffect(() => {
    const initializeData = async () => {
      // First fetch customers and cleaners
      await Promise.all([fetchCustomers(), fetchCleaners()]);
      
      // Then handle prefilled data from URL parameters
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
        const bookingId = searchParams.get('bookingId');
        
        // Fix payment method name
        let fixedPaymentMethod = paymentMethod;
        if (paymentMethod === 'Freeagent') {
          fixedPaymentMethod = 'Invoiless';
        }
        
        console.log('URL Parameters:', { customerId, cleaner, bookingId });
        
        setFormData(prev => ({
          ...prev,
          client: customerId || '',
          cleaning_type: decodeURIComponent(cleaningType || 'Standard Cleaning'),
          hours: hours || '2',
          cost_per_hour: costPerHour || '20',
          total_cost: totalCost || '40',
          payment_method: fixedPaymentMethod || 'Cash',
          cleaner_rate: cleanerRate || '16',
          cleaner: cleaner || '',
          cleaner_assignment: cleaner ? 'assigned' : 'unassigned'
        }));

        // Fetch original booking date and auto-populate start date and days
        if (bookingId) {
          await fetchOriginalBookingData(bookingId);
        }
      }
    };
    
    initializeData();
  }, [searchParams]);

  const fetchOriginalBookingData = async (bookingId: string) => {
    try {
      console.log('Fetching booking data for ID:', bookingId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('date_time, date_only, cleaner_rate, cleaner_pay')
        .eq('id', parseInt(bookingId))
        .single();

      if (error) throw error;
      
      console.log('Original booking data:', data);
      
      if (data && data.date_time) {
        const originalDate = new Date(data.date_time);
        console.log('Original date from booking:', originalDate);
        
        // No timezone adjustment needed - use the date as is
        console.log('Using date as is:', originalDate);
        
        const dayName = originalDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        console.log('Day name:', dayName);
        
        // Set the date as selected date
        setSelectedDate(originalDate);
        
        // Auto-select the day of the week
        setSelectedDays([dayName]);
        setFormData(prev => ({
          ...prev,
          days_of_the_week: dayName,
          days_number: '1',
          start_date: originalDate.toISOString().split('T')[0],
          cleaner_rate: data.cleaner_rate?.toString() || prev.cleaner_rate
        }));
      }
    } catch (error) {
      console.error('Error fetching original booking data:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .order('first_name');

      if (error) throw error;
      console.log('Fetched customers:', data?.length);
      setCustomers(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  };

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, email, hourly_rate')
        .order('first_name');

      if (error) throw error;
      console.log('Fetched cleaners:', data?.length);
      setCleaners(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      return [];
    }
  };

  useEffect(() => {
    if (formData.client) {
      fetchAddresses(parseInt(formData.client));
    }
  }, [formData.client]);

  useEffect(() => {
    calculateTotalCost();
  }, [formData.hours, formData.cost_per_hour]);

  // Auto-select single address and ensure cleaner is selected
  useEffect(() => {
    if (addresses.length === 1 && !formData.address) {
      setFormData(prev => ({ ...prev, address: addresses[0].id }));
    }
  }, [addresses, formData.address]);

  // Ensure cleaner gets selected after cleaners are loaded
  useEffect(() => {
    const cleanerParam = searchParams.get('cleaner');
    if (cleanerParam && cleaners.length > 0 && !formData.cleaner) {
      console.log('Setting cleaner from URL:', cleanerParam);
      setFormData(prev => ({ 
        ...prev, 
        cleaner: cleanerParam,
        cleaner_assignment: 'assigned'
      }));
    }
  }, [cleaners, searchParams, formData.cleaner]);

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

  const handleCleanerChange = async (cleanerId: string) => {
    if (cleanerId === 'unassigned') {
      setFormData(prev => ({
        ...prev,
        cleaner: '',
        cleaner_rate: '',
        cost_per_hour: prev.cost_per_hour
      }));
    } else {
      const cleaner = cleaners.find(c => c.id === parseInt(cleanerId));
      let cleanerRate = cleaner?.hourly_rate || 0;
      
      // Check for custom rate if this is for an existing recurring group
      const customerId = formData.client;
      if (customerId && cleaner) {
        const { data: customRate } = await supabase
          .from('cleaner_recurring_rates')
          .select('custom_hourly_rate, custom_percentage_rate')
          .eq('cleaner_id', cleaner.id)
          .eq('recurring_group_id', formData.recurringGroupId || 'temp')
          .single();
          
        if (customRate && customRate.custom_hourly_rate) {
          cleanerRate = customRate.custom_hourly_rate;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        cleaner: cleanerId,
        cleaner_rate: cleanerRate.toString(),
        cost_per_hour: cleanerRate.toString()
      }));
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string) => {
    const newHour = type === 'hour' ? value : selectedHour;
    const newMinute = type === 'minute' ? value : selectedMinute;
    const newPeriod = type === 'period' ? value : selectedPeriod;
    
    if (type === 'hour') setSelectedHour(value);
    if (type === 'minute') setSelectedMinute(value);
    if (type === 'period') setSelectedPeriod(value);
    
    const newTime = `${newHour}:${newMinute} ${newPeriod}`;
    setSelectedTime(newTime);
    setFormData(prev => ({ ...prev, start_time: newTime }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (loading) {
      console.log('AddRecurringBooking: Submission already in progress, ignoring');
      return;
    }
    
    setLoading(true);

    try {
      // Generate a unique recurring group ID for this booking series
      const recurringGroupId = crypto.randomUUID();
      
      // Determine interval based on frequency
      let interval = '7'; // Default to weekly
      if (formData.frequently === 'bi-weekly' || formData.frequently === 'biweekly') interval = '14';
      if (formData.frequently === 'monthly') interval = '30';

      // Get current user and their role for tracking
      const { data: { user } } = await supabase.auth.getUser();
      let createdBySource = 'website';
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (userRole?.role === 'admin') {
          createdBySource = 'admin';
        } else if (userRole?.role === 'sales_agent') {
          createdBySource = 'sales_agent';
        } else {
          createdBySource = 'customer';
        }
      }
      
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
        start_date: selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : formData.start_date,
        start_time: selectedTime,
        postponed: formData.postponed,
        confirmed: formData.confirmed, // Allow pre-confirming when manually creating
        interval: interval,
        recurring_group_id: recurringGroupId,
        // Tracking - who created this recurring service
        created_by_user_id: user?.id || null,
        created_by_source: createdBySource
      };

      console.log('Submitting recurring service with data:', submitData);

      const { error } = await supabase
        .from('recurring_services')
        .insert([submitData]);

      if (error) throw error;

      // Save custom cleaner rate if different from default
      if (formData.cleaner && formData.cleaner_rate) {
        const selectedCleaner = cleaners.find(c => c.id === parseInt(formData.cleaner));
        if (selectedCleaner && selectedCleaner.hourly_rate !== parseFloat(formData.cleaner_rate)) {
          const { error: rateError } = await supabase
            .from('cleaner_recurring_rates')
            .insert([{
              cleaner_id: parseInt(formData.cleaner),
              recurring_group_id: recurringGroupId,
              custom_hourly_rate: parseFloat(formData.cleaner_rate),
              custom_percentage_rate: null
            }]);
          
          if (rateError) {
            console.error('Error saving custom cleaner rate:', rateError);
          }
        }
      }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
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
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="h-6 w-6" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700">Customer *</Label>
                  <Select value={formData.client} onValueChange={(value) => setFormData(prev => ({ ...prev, client: value }))}>
                    <SelectTrigger className="mt-1 border-2 border-gray-200 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
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
                  className="mt-6 text-blue-600 border-blue-300 hover:border-blue-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>

              {formData.client && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Address *</Label>
                  <Select value={formData.address} onValueChange={(value) => setFormData(prev => ({ ...prev, address: value }))}>
                    <SelectTrigger className="mt-1 border-2 border-gray-200 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
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

          {/* Date & Time Selection */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <CalendarDays className="h-6 w-6" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal border-2 border-gray-200 hover:border-purple-400 transition-colors",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                            setSelectedDays([dayName]);
                            setFormData(prev => ({
                              ...prev,
                              days_of_the_week: dayName,
                              days_number: '1',
                              start_date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                            }));
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="p-4 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-700">Time *</Label>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <Select value={selectedHour} onValueChange={(value) => handleTimeChange('hour', value)}>
                        <SelectTrigger className="w-20 border-2 border-purple-200 focus:border-purple-500">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <span className="text-xl font-bold text-purple-600">:</span>
                    
                    <Select value={selectedMinute} onValueChange={(value) => handleTimeChange('minute', value)}>
                      <SelectTrigger className="w-20 border-2 border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedPeriod} onValueChange={(value) => handleTimeChange('period', value)}>
                      <SelectTrigger className="w-20 border-2 border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-center text-lg font-semibold text-purple-600 bg-white rounded-lg py-2 border-2 border-purple-200">
                    Selected: {selectedTime}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Frequency *</Label>
                <Select value={formData.frequently} onValueChange={(value) => setFormData(prev => ({ ...prev, frequently: value }))}>
                  <SelectTrigger className="mt-1 border-2 border-gray-200 focus:border-purple-500 transition-colors">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Service Type *</Label>
                <Select value={formData.cleaning_type} onValueChange={(value) => setFormData(prev => ({ ...prev, cleaning_type: value }))}>
                  <SelectTrigger className="mt-1 border-2 border-gray-200 focus:border-purple-500 transition-colors">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes?.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.frequently === 'weekly' && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Days of the Week *</Label>
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2 p-3 rounded-lg border-2 border-purple-200 hover:bg-purple-50 transition-colors">
                        <Checkbox
                          id={day.id}
                          checked={selectedDays.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(day.id)}
                          className="border-2 border-purple-400"
                        />
                        <Label htmlFor={day.id} className="text-xs font-medium">{day.label.slice(0, 3)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation Status */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50/50">
                <Checkbox
                  id="confirmed"
                  checked={formData.confirmed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmed: checked === true }))}
                  className="border-2 border-emerald-400"
                />
                <div className="flex-1">
                  <Label htmlFor="confirmed" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Already Confirmed
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Check this if this is an existing customer and you don't need to wait for the first clean to confirm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cleaner Assignment */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-6 w-6" />
                Cleaner Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700">Cleaner</Label>
                  <Select value={formData.cleaner} onValueChange={handleCleanerChange}>
                    <SelectTrigger className="mt-1 border-2 border-gray-200 focus:border-green-500 transition-colors">
                      <SelectValue placeholder="Select a cleaner" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                       {cleaners.map((cleaner) => (
                         <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                           {cleaner.first_name} {cleaner.last_name}
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateCleaner(true)}
                  className="mt-6 text-green-600 border-green-300 hover:border-green-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>

              {formData.cleaner && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Payment Structure</Label>
                    <Select value={formData.payment_structure} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_structure: value }))}>
                      <SelectTrigger className="mt-1 border-2 border-green-200 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.payment_structure === 'hourly' ? (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Hourly Rate (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cleaner_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, cleaner_rate: e.target.value }))}
                        className="mt-1 border-2 border-green-200 focus:border-green-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.cleaner_percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, cleaner_percentage: e.target.value }))}
                        className="mt-1 border-2 border-green-200 focus:border-green-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Payment */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Banknote className="h-6 w-6" />
                Payment & Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Hours per Visit *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                    className="mt-1 border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Rate per Hour (£) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_hour}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_per_hour: e.target.value }))}
                    className="mt-1 border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Total per Visit (Auto-calculated)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_cost}
                    readOnly
                    className="mt-1 bg-gray-50 text-gray-600 border-2 border-gray-200"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Payment Method *</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger className="mt-1 border-2 border-gray-200 focus:border-indigo-500 transition-colors">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                   <SelectContent>
                     {paymentMethods?.map((method) => (
                       <SelectItem key={method.key} value={method.key}>
                         {method.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/recurring-bookings')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="min-w-[200px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
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
    </div>
  );
}