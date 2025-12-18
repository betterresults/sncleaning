import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, User, MapPin, Clock, Banknote, Home, Calendar as CalendarIcon, Key, Plus, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CustomerSelector from './CustomerSelector';
import CleanerSelector from './CleanerSelector';
import AddressSelector from './AddressSelector';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import LinenManagementSelector from './LinenManagementSelector';
import { LinenUsageItem } from '@/hooks/useLinenProducts';
import { useServiceTypes, useCleaningTypes, usePaymentMethods, getServiceTypeBadgeColor, getServiceTypeLabel, getCleaningTypeLabel } from '@/hooks/useCompanySettings';
import { usePaymentMethodCheck } from '@/hooks/usePaymentMethodCheck';

interface NewBookingFormProps {
  onBookingCreated: () => void;
  isCustomerView?: boolean;
  preselectedCustomer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface BookingData {
  // Customer info
  customerId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  
  // Cleaner info
  cleanerId: number | null;
  cleanerName: string;
  
  // Booking details
  selectedDate: Date | undefined;
  selectedTime: string;
  selectedHour: string;
  selectedMinute: string;
  selectedPeriod: string;
  address: string;
  postcode: string;
  
  // Address selection
  addressId: string | null;
  selectedAddress: any | null;
  
  // Service details
  serviceType: string;
  cleaningSubType: string;
  totalHours: number;
  cleaningTime: string;
  costPerHour: number;
  
  // Airbnb specific
  isSameDayCleaning: boolean;
  
  // Additional cleaning items
  carpetCleaningItems: string;
  mattressCleaningItems: string;
  upholsteryCleaningItems: string;
  
  // Property access
  propertyAccess: string;
  keyPickupAddress: string;
  useClientAddress: boolean;
  useClientAddressForKeys: boolean;
  keyCollectionNotes: string;
  
  // Cost and payment
  totalCost: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  cleanerPay: number;
  paymentMethod: string;
  paymentStatus: string;
  
  // Cleaner rate overrides
  cleanerHourlyRate: number;
  cleanerPercentage: number;
  
  // Additional details
  propertyDetails: string;
  additionalDetails: string;
  
  // Linen management
  linenManagement: boolean;
  linenUsed: LinenUsageItem[];
  
  // Email notification
  sendConfirmationEmail: boolean;
}

const NewBookingForm = ({ onBookingCreated, isCustomerView = false, preselectedCustomer }: NewBookingFormProps) => {
  console.log('NewBookingForm: Component rendering started');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookingData>({
    customerId: null,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    cleanerId: null,
    cleanerName: '',
    selectedDate: undefined,
    selectedTime: '09:00 AM',
    selectedHour: '09',
    selectedMinute: '00',
    selectedPeriod: 'AM',
    address: '',
    postcode: '',
    addressId: null,
    selectedAddress: null,
    serviceType: '',
    cleaningSubType: '',
    totalHours: 0,
    cleaningTime: '',
    costPerHour: 0,
    isSameDayCleaning: false,
    carpetCleaningItems: '',
    mattressCleaningItems: '',
    upholsteryCleaningItems: '',
    propertyAccess: '',
    keyPickupAddress: '',
    useClientAddress: false,
    useClientAddressForKeys: false,
    keyCollectionNotes: '',
    totalCost: 0,
    discount: 0,
    discountType: 'fixed',
    cleanerPay: 0,
    paymentMethod: 'Stripe',
    paymentStatus: 'Unpaid',
    cleanerHourlyRate: 0,
    cleanerPercentage: 70,
    propertyDetails: '',
    additionalDetails: '',
    linenManagement: false,
    linenUsed: [],
    sendConfirmationEmail: true
  });

  const [showAddPropertyAccessDialog, setShowAddPropertyAccessDialog] = useState(false);
  const [newPropertyAccess, setNewPropertyAccess] = useState({ label: '', value: '', icon: '' });
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const navigate = useNavigate();
  
  // Check if customer has payment methods (for admin mode)
  const { hasPaymentMethods, loading: loadingPaymentMethods } = usePaymentMethodCheck(formData.customerId);
  
  // Fetch service and cleaning types from company settings
  const { data: serviceTypesFromSettings, isLoading: loadingServiceTypes } = useServiceTypes();
  const { data: cleaningTypesFromSettings, isLoading: loadingCleaningTypes } = useCleaningTypes();
  const { data: paymentMethodsFromSettings, isLoading: loadingPaymentMethodsSettings } = usePaymentMethods();
  
  console.log('NewBookingForm: State initialized, formData:', formData);

  // Auto-populate customer information if in customer view
  useEffect(() => {
    if (isCustomerView && preselectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId: preselectedCustomer.id,
        firstName: preselectedCustomer.first_name || '',
        lastName: preselectedCustomer.last_name || '',
        email: preselectedCustomer.email || '',
        phoneNumber: preselectedCustomer.phone || ''
      }));
    }
  }, [isCustomerView, preselectedCustomer]);

  // Map service types from settings to the format expected by the form
  const serviceTypes = serviceTypesFromSettings?.map((st) => {
    const colorMap: Record<string, string> = {
      domestic: 'from-blue-500 to-cyan-500',
      commercial: 'from-purple-500 to-pink-500',
      airbnb: 'from-green-500 to-emerald-500',
      end_of_tenancy: 'from-orange-500 to-red-500',
      deep_cleaning: 'from-indigo-500 to-purple-500',
      carpet_cleaning: 'from-teal-500 to-blue-500',
    };
    return {
      value: st.key,
      label: st.label,
      color: colorMap[st.key] || 'from-gray-500 to-gray-600',
    };
  }) || [];

  const cleaningSubTypes = React.useMemo(() => {
    if (!formData.serviceType || !serviceTypesFromSettings || !cleaningTypesFromSettings) {
      return [];
    }
    
    const currentServiceType = serviceTypesFromSettings.find(st => st.key === formData.serviceType);
    const allowedCleaningTypes = currentServiceType?.allowed_cleaning_types || [];
    
    return cleaningTypesFromSettings
      .filter(ct => allowedCleaningTypes.includes(ct.key))
      .map((ct) => ({
        value: ct.key,
        label: ct.label,
      }));
  }, [formData.serviceType, serviceTypesFromSettings, cleaningTypesFromSettings]);

  const [propertyAccessOptions, setPropertyAccessOptions] = useState([
    { value: 'customer_present', label: 'Customer will be present', icon: '👤' },
    { value: 'key_left', label: 'Key will be left', icon: '🗝️' },
    { value: 'keybox_access', label: 'Keybox access', icon: '📦' },
    { value: 'estate_agent', label: 'Pick up keys from estate agent', icon: '🏢' },
    { value: 'other', label: 'Other arrangement', icon: '📝' }
  ]);

  // Map payment methods from settings
  const paymentMethods = paymentMethodsFromSettings?.map(pm => pm.label) || [];

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  // Check if service type requires hourly input
  const requiresHours = ['domestic', 'commercial', 'airbnb'].includes(formData.serviceType);
  
  // Check if service type requires cleaning time
  const requiresCleaningTime = ['end_of_tenancy', 'deep_cleaning', 'carpet_cleaning'].includes(formData.serviceType);
  
  // Check if service type shows subcategory
  const showSubCategory = ['domestic', 'commercial', 'airbnb'].includes(formData.serviceType);
  
  // Check if service type shows additional cleaning items
  const showCleaningItems = ['end_of_tenancy', 'deep_cleaning', 'carpet_cleaning'].includes(formData.serviceType);

  // Check if Airbnb service type
  const isAirbnbService = formData.serviceType === 'airbnb';

  const handleInputChange = (field: keyof BookingData, value: string | number | boolean | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: value
      };
      
      // Update the combined time string
      const hour = type === 'hour' ? value : prev.selectedHour;
      const minute = type === 'minute' ? value : prev.selectedMinute;
      const period = type === 'period' ? value : prev.selectedPeriod;
      
      newData.selectedTime = `${hour}:${minute} ${period}`;
      return newData;
    });
  };

  const handleServiceTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceType: value,
      cleaningSubType: '',
      totalHours: 0,
      cleaningTime: '',
      isSameDayCleaning: false,
      costPerHour: 0,
      totalCost: 0
    }));
  };

  // Convert 12-hour time to 24-hour time
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours}:${minutes}`;
  };

  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email || '',
        phoneNumber: customer.phone || '',
        addressId: null,
        selectedAddress: null,
        address: '',
        postcode: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: null,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        addressId: null,
        selectedAddress: null,
        address: '',
        postcode: ''
      }));
    }
  };

  const handleAddressSelect = (address: any | null) => {
    if (!address) {
      setFormData(prev => ({
        ...prev,
        addressId: null,
        selectedAddress: null,
        address: '',
        postcode: '',
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      addressId: address.id,
      selectedAddress: address,
      address: address.address,
      postcode: address.postcode,
    }));
  };

  const handleCleanerSelect = (cleaner: any) => {
    if (cleaner) {
      setFormData(prev => ({
        ...prev,
        cleanerId: cleaner.id,
        cleanerName: cleaner.full_name || `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim() || '',
        cleanerHourlyRate: cleaner.hourly_rate || 0,
        cleanerPercentage: cleaner.presentage_rate || 70
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cleanerId: null,
        cleanerName: '',
        cleanerHourlyRate: 0,
        cleanerPercentage: 70
      }));
    }
  };

  const handleUseClientAddress = (checked: boolean) => {
    if (checked && formData.customerId) {
      // Fetch customer's default address from addresses table
      const fetchCustomerAddress = async () => {
        const { data, error } = await supabase
          .from('addresses')
          .select('address, postcode')
          .eq('customer_id', formData.customerId)
          .eq('is_default', true)
          .single();
        
        if (data && !error && data.address && data.postcode) {
          setFormData(prev => ({
            ...prev,
            useClientAddress: checked,
            address: data.address,
            postcode: data.postcode
          }));
        } else {
          // If no default address found, try to get any address for this customer
          const { data: anyAddress, error: anyError } = await supabase
            .from('addresses')
            .select('address, postcode')
            .eq('customer_id', formData.customerId)
            .limit(1)
            .single();
          
          if (anyAddress && !anyError && anyAddress.address && anyAddress.postcode) {
            setFormData(prev => ({
              ...prev,
              useClientAddress: checked,
              address: anyAddress.address,
              postcode: anyAddress.postcode
            }));
          } else {
            // Show a message if no address is found
            toast({
              title: "No Address Found",
              description: "This customer doesn't have a saved address. Please enter it manually.",
              variant: "destructive",
            });
            setFormData(prev => ({
              ...prev,
              useClientAddress: false
            }));
          }
        }
      };
      fetchCustomerAddress();
    } else {
      setFormData(prev => ({
        ...prev,
        useClientAddress: checked,
        address: '',
        postcode: ''
      }));
    }
  };

  const handleUseClientAddressForKeys = async (checked: boolean) => {
    if (checked && formData.customerId) {
      // Fetch customer's default address from addresses table
      const { data, error } = await supabase
        .from('addresses')
        .select('address, postcode')
        .eq('customer_id', formData.customerId)
        .eq('is_default', true)
        .single();
      
      if (data && !error && data.address && data.postcode) {
        setFormData(prev => ({
          ...prev,
          useClientAddressForKeys: checked,
          keyPickupAddress: `${data.address}, ${data.postcode}`
        }));
      } else {
        toast({
          title: "No Address Found",
          description: "This customer doesn't have a saved address for key pickup. Please enter it manually.",
          variant: "destructive",
        });
        setFormData(prev => ({
          ...prev,
          useClientAddressForKeys: false
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        useClientAddressForKeys: checked,
        keyPickupAddress: ''
      }));
    }
  };

  const buildAccessDetails = () => {
    let accessDetails = '';
    
    // Add the access method
    if (formData.propertyAccess) {
      const accessMethod = formData.propertyAccess.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      accessDetails += `Access Method: ${accessMethod}`;
    }
    
    // Add the notes
    if (formData.keyCollectionNotes && formData.keyCollectionNotes.trim()) {
      if (accessDetails) accessDetails += '\n\n';
      accessDetails += `Notes: ${formData.keyCollectionNotes.trim()}`;
    }
    
    return accessDetails || null;
  };

  // Helper to calculate discount amount
  const calculateDiscountAmount = (baseCost: number) => {
    if (!formData.discount || formData.discount <= 0) return 0;
    if (formData.discountType === 'percentage') {
      return (baseCost * formData.discount) / 100;
    }
    return formData.discount;
  };

  // Calculate total cost for hourly services (before discount)
  useEffect(() => {
    if (requiresHours && formData.totalHours > 0 && formData.costPerHour > 0) {
      const baseCost = formData.totalHours * formData.costPerHour;
      const discountAmount = calculateDiscountAmount(baseCost);
      const finalCost = Math.max(0, baseCost - discountAmount);
      setFormData(prev => ({
        ...prev,
        totalCost: finalCost
      }));
    }
  }, [formData.totalHours, formData.costPerHour, formData.discount, formData.discountType, requiresHours]);

  const calculateCleanerPay = () => {
    let cleanerPay = 0;
    if (requiresHours && formData.totalHours > 0 && formData.cleanerHourlyRate > 0) {
      cleanerPay = formData.totalHours * formData.cleanerHourlyRate;
    } else if (formData.cleanerPercentage > 0) {
      cleanerPay = formData.totalCost * (formData.cleanerPercentage / 100);
    }
    
    setFormData(prev => ({
      ...prev,
      cleanerPay: cleanerPay
    }));
  };

  useEffect(() => {
    calculateCleanerPay();
  }, [formData.totalCost, formData.totalHours, formData.cleanerHourlyRate, formData.cleanerPercentage]);

  const handleAddPropertyAccess = () => {
    if (newPropertyAccess.label && newPropertyAccess.value) {
      setPropertyAccessOptions(prev => [...prev, {
        value: newPropertyAccess.value.toLowerCase().replace(/\s+/g, '_'),
        label: newPropertyAccess.label,
        icon: newPropertyAccess.icon || '📝'
      }]);
      setNewPropertyAccess({ label: '', value: '', icon: '' });
      setShowAddPropertyAccessDialog(false);
      toast({
        title: "Success",
        description: "New property access option added!",
      });
    }
  };

  const handleSendQuote = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid customer email address.",
        variant: "destructive",
      });
      return;
    }

    if (formData.totalCost <= 0) {
      toast({
        title: "Error",
        description: "Please set a valid total cost for the quote.",
        variant: "destructive",
      });
      return;
    }

    setSendingQuote(true);
    try {
      // Generate a unique session ID for this quote
      const quoteSessionId = `admin_quote_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Get current user info for admin tracking
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save the quote to quote_leads so it can be resumed with exact pricing
      const { error: saveError } = await supabase.from('quote_leads').upsert({
        session_id: quoteSessionId,
        service_type: formData.serviceType === 'domestic' ? 'Domestic' : formData.serviceType,
        cleaning_type: formData.cleaningSubType || formData.serviceType,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        postcode: formData.postcode,
        address: formData.address,
        calculated_quote: formData.totalCost,
        recommended_hours: formData.totalHours || null,
        discount_amount: formData.discount || 0,
        selected_date: formData.selectedDate?.toISOString().split('T')[0] || null,
        selected_time: formData.selectedTime,
        source: 'admin',
        status: 'quote_sent',
        furthest_step: 'admin_quote',
        created_by_admin_id: user?.id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });

      if (saveError) {
        console.error('Error saving quote lead:', saveError);
        // Continue anyway - email can still be sent
      }

      const { data, error } = await supabase.functions.invoke('send-admin-quote-email', {
        body: {
          customerName: `${formData.firstName} ${formData.lastName}`.trim() || 'Valued Customer',
          customerEmail: formData.email,
          address: formData.address,
          postcode: formData.postcode,
          serviceType: formData.serviceType,
          cleaningType: formData.cleaningSubType || formData.serviceType,
          totalHours: formData.totalHours || null,
          totalCost: formData.totalCost,
          hourlyRate: formData.costPerHour || 22,
          discount: formData.discount || 0,
          selectedDate: formData.selectedDate?.toISOString() || null,
          selectedTime: formData.selectedTime,
          additionalDetails: formData.additionalDetails,
          propertyDetails: formData.propertyDetails,
          // Pass the session ID so the email link can include it for resuming
          quoteSessionId: quoteSessionId,
        },
      });

      if (error) throw error;

      setShowQuoteDialog(false);
      toast({
        title: "Quote Sent!",
        description: `Quote email sent successfully to ${formData.email}`,
      });
    } catch (error: any) {
      console.error('Error sending quote email:', error);
      toast({
        title: "Failed to Send Quote",
        description: error.message || "There was an issue sending the quote email.",
        variant: "destructive",
      });
    } finally {
      setSendingQuote(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions - guard against rapid clicks before loading state updates
    if (loading) {
      console.log('NewBookingForm: Submission already in progress, ignoring');
      return;
    }
    
    setLoading(true);

    try {
      if (!formData.selectedDate) {
        toast({
          title: "Error",
          description: "Please select a date.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Combine date and time properly - ALWAYS treat as London time regardless of user's timezone
      const time24h = convertTo24Hour(formData.selectedTime);
      const [hours, minutes] = time24h.split(':');
      
      // Extract date components directly from the selected date
      // Use local getters since the calendar sets the date in local timezone
      const year = formData.selectedDate.getFullYear();
      const month = String(formData.selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(formData.selectedDate.getDate()).padStart(2, '0');
      const dateOnly = `${year}-${month}-${day}`;
      const timeOnly = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      
      // Build the datetime string directly as London time (UTC+0)
      // This ensures the booking time is always correct regardless of user's location
      const dateTimeStr = `${dateOnly}T${timeOnly}+00:00`;

      // Determine form_name based on service type and sub type
      let formName = '';
      if (showSubCategory && formData.cleaningSubType) {
        formName = formData.cleaningSubType === 'standard_cleaning' ? 'Standard Cleaning' : 'Deep Cleaning';
      } else {
        switch (formData.serviceType) {
          case 'end_of_tenancy':
            formName = 'End of Tenancy';
            break;
          case 'deep_cleaning':
            formName = 'Deep Cleaning';
            break;
          case 'carpet_cleaning':
            formName = 'Carpet Cleaning';
            break;
          default:
            formName = 'Standard Cleaning';
        }
      }

      // Determine cleaning_type
      let cleaningType = '';
      switch (formData.serviceType) {
        case 'domestic':
          cleaningType = 'Domestic';
          break;
        case 'commercial':
          cleaningType = 'Commercial';
          break;
        case 'airbnb':
          cleaningType = 'Air BnB';
          break;
        default:
          cleaningType = 'Domestic';
      }

      // Build additional details
      let additionalDetails = formData.additionalDetails;
      if (showCleaningItems) {
        const cleaningItems = [];
        if (formData.carpetCleaningItems) cleaningItems.push(`Carpet items: ${formData.carpetCleaningItems}`);
        if (formData.mattressCleaningItems) cleaningItems.push(`Mattress items: ${formData.mattressCleaningItems}`);
        if (formData.upholsteryCleaningItems) cleaningItems.push(`Upholstery items: ${formData.upholsteryCleaningItems}`);
        
        if (cleaningItems.length > 0) {
          additionalDetails = additionalDetails ? 
            `${additionalDetails}\n\n${cleaningItems.join('\n')}` : 
            cleaningItems.join('\n');
        }
      }

      // Add property access information
      if (formData.propertyAccess) {
        const accessInfo = `Property Access: ${propertyAccessOptions.find(opt => opt.value === formData.propertyAccess)?.label}`;
        const keyInfo = formData.propertyAccess === 'estate_agent' && formData.keyPickupAddress ? 
          `\nKey pickup address: ${formData.keyPickupAddress}` : '';
        
        additionalDetails = additionalDetails ? 
          `${additionalDetails}\n\n${accessInfo}${keyInfo}` : 
          `${accessInfo}${keyInfo}`;
      }

      // Set frequently field for Airbnb same day cleaning
      let frequently = null;
      if (isAirbnbService && formData.isSameDayCleaning) {
        frequently = 'Same Day';
      }

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

      const bookingData = {
        customer: formData.customerId,
        cleaner: formData.cleanerId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        date_time: dateTimeStr,
        date_only: dateOnly,
        time_only: timeOnly,
        address: formData.address,
        postcode: formData.postcode,
        total_hours: requiresHours ? formData.totalHours : null,
        cleaning_time: requiresCleaningTime ? parseFloat(formData.cleaningTime) || null : null,
        total_cost: formData.totalCost,
        discount: formData.discount || 0,
        cleaner_pay: formData.cleanerPay,
        cleaner_rate: formData.cleanerHourlyRate || null,
        cleaner_percentage: formData.cleanerPercentage || null,
        cleaning_type: formName,
        service_type: cleaningType,
        property_details: formData.propertyDetails,
        additional_details: additionalDetails,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentStatus,
        booking_status: 'Confirmed',
        frequently: frequently,
        access: buildAccessDetails(),
        key_collection: formData.keyPickupAddress || null,
        cleaning_cost_per_hour: requiresHours ? formData.costPerHour : null,
        linen_management: formData.linenManagement,
        linen_used: formData.linenManagement && formData.linenUsed.length > 0 ? JSON.parse(JSON.stringify(formData.linenUsed)) : null,
        // Tracking - who created this booking
        created_by_user_id: user?.id || null,
        created_by_source: createdBySource
      };

      console.log('NewBookingForm: Attempting to create booking with data:', bookingData);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (error) {
        console.error('Error creating booking:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code,
          bookingData
        });
        
        let errorMessage = "Failed to create booking. Please try again.";
        
        // Provide more specific error messages based on the error
        if (error.message?.includes('violates foreign key constraint')) {
          errorMessage = "Invalid customer or cleaner selected. Please check your selections.";
        } else if (error.message?.includes('violates not-null constraint')) {
          errorMessage = "Missing required information. Please fill in all required fields.";
        } else if (error.message?.includes('violates check constraint')) {
          errorMessage = "Invalid data format. Please check your entries.";
        } else if (error.message) {
          errorMessage = `Database error: ${error.message}`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log('NewBookingForm: Booking created successfully:', data);

      // Note: Confirmation email is now handled automatically by the notification trigger system
      // (trigger_event: 'booking_created') to avoid duplicate emails

      toast({
        title: "Success",
        description: "Booking created successfully! Confirmation email sent.",
      });

      onBookingCreated();
      
      // Navigate to upcoming bookings page
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  console.log('NewBookingForm: About to render component');

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800">Processing booking...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait, this may take a few seconds</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Back Button and Send as Quote - Only for admin/agent view */}
        {!isCustomerView && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
              <DialogTrigger asChild>
                <Button 
                  type="button"
                  variant="outline"
                  className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:border-amber-600 transition-colors"
                  disabled={!formData.email || formData.totalCost <= 0}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send as Quote
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-600" />
                    Send Quote to Customer
                  </DialogTitle>
                  <DialogDescription>
                    Send this booking as a quote email to the customer. They can review and book later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                    <p className="font-medium text-amber-800">Quote Summary</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="font-bold text-lg">£{formData.totalCost.toFixed(2)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-£{formData.discount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowQuoteDialog(false)}
                      disabled={sendingQuote}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendQuote}
                      disabled={sendingQuote}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {sendingQuote ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Quote
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Customer Selection - Only show for admin view */}
        {!isCustomerView && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="h-6 w-6" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <CustomerSelector onCustomerSelect={handleCustomerSelect} />
              
              {/* Address Selection - Show when customer is selected */}
              {formData.customerId && (
                <AddressSelector 
                  customerId={formData.customerId}
                  onAddressSelect={handleAddressSelect}
                />
              )}
              
              {/* Show selected address info */}
              {formData.selectedAddress && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{formData.selectedAddress.address}</p>
                        <p className="text-sm text-gray-600">{formData.selectedAddress.postcode}</p>
                        {formData.selectedAddress.deatails && (
                          <p className="text-xs text-gray-500 mt-1">{formData.selectedAddress.deatails}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information Display - Only show for customer view */}
        {isCustomerView && preselectedCustomer && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="h-6 w-6" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Booking for:</p>
                <p className="font-semibold text-gray-800">
                  {preselectedCustomer.first_name} {preselectedCustomer.last_name}
                </p>
                <p className="text-gray-600">{preselectedCustomer.email}</p>
                <p className="text-gray-600">{preselectedCustomer.phone}</p>
              </div>
              
              {/* Address Selection for Customer View */}
              <div className="mt-4">
                <AddressSelector 
                  customerId={preselectedCustomer.id}
                  onAddressSelect={handleAddressSelect}
                />
              </div>
              
              {/* Show selected address info */}
              {formData.selectedAddress && (
                <Card className="border-blue-200 bg-blue-50 mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{formData.selectedAddress.address}</p>
                        <p className="text-sm text-gray-600">{formData.selectedAddress.postcode}</p>
                        {formData.selectedAddress.deatails && (
                          <p className="text-xs text-gray-500 mt-1">{formData.selectedAddress.deatails}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

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
                <Label className="text-sm font-semibold text-gray-700">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-2 border-gray-200 hover:border-purple-400 transition-colors",
                        !formData.selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.selectedDate ? format(formData.selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.selectedDate}
                      onSelect={(date) => handleInputChange('selectedDate', date)}
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
                    <Select value={formData.selectedHour} onValueChange={(value) => handleTimeChange('hour', value)}>
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
                  
                  <Select value={formData.selectedMinute} onValueChange={(value) => handleTimeChange('minute', value)}>
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
                  
                  <Select value={formData.selectedPeriod} onValueChange={(value) => handleTimeChange('period', value)}>
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
                  Selected: {formData.selectedTime}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Home className="h-6 w-6" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="serviceType" className="text-sm font-semibold text-gray-700">Service Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map((service) => (
                  <div
                    key={service.value}
                    className={cn(
                      "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105",
                      formData.serviceType === service.value
                        ? `bg-gradient-to-r ${service.color} text-white border-transparent shadow-lg`
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleServiceTypeChange(service.value)}
                  >
                    <div className="text-center font-medium">
                      {service.label}
                    </div>
                    {formData.serviceType === service.value && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showSubCategory && (
              <div className="space-y-2">
                <Label htmlFor="cleaningSubType" className="text-sm font-semibold text-gray-700">Cleaning Type *</Label>
                <Select value={formData.cleaningSubType} onValueChange={(value) => handleInputChange('cleaningSubType', value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-green-500">
                    <SelectValue placeholder="Select cleaning type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaningSubTypes.map((subType) => (
                      <SelectItem key={subType.value} value={subType.value}>
                        {subType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isAirbnbService && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <Checkbox
                  id="isSameDayCleaning"
                  checked={formData.isSameDayCleaning}
                  onCheckedChange={(checked) => handleInputChange('isSameDayCleaning', checked)}
                  className="border-2 border-green-400"
                />
                <Label htmlFor="isSameDayCleaning" className="text-sm font-semibold text-green-700">Same Day Cleaning</Label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {requiresHours && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="totalHours" className="text-sm font-semibold text-gray-700">Total Hours *</Label>
                    <Input
                      id="totalHours"
                      type="number"
                      step="0.5"
                      min="1"
                      value={formData.totalHours}
                      onChange={(e) => handleInputChange('totalHours', parseFloat(e.target.value) || 0)}
                      className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPerHour" className="text-sm font-semibold text-gray-700">Cost per Hour (£) *</Label>
                    <Input
                      id="costPerHour"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPerHour}
                      onChange={(e) => handleInputChange('costPerHour', parseFloat(e.target.value) || 0)}
                      className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                      required
                    />
                  </div>
                </>
              )}

              {requiresCleaningTime && (
                <div className="space-y-2">
                  <Label htmlFor="cleaningTime" className="text-sm font-semibold text-gray-700">Cleaning Time *</Label>
                  <Input
                    id="cleaningTime"
                    placeholder="e.g., 2-3 hours, Half day, Full day"
                    value={formData.cleaningTime}
                    onChange={(e) => handleInputChange('cleaningTime', e.target.value)}
                    className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
              )}
            </div>

            {showCleaningItems && (
              <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <h4 className="font-bold text-lg text-blue-700">Additional Cleaning Items</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="carpetCleaningItems" className="text-sm font-semibold text-gray-700">Carpet Cleaning Items</Label>
                    <Textarea
                      id="carpetCleaningItems"
                      value={formData.carpetCleaningItems}
                      onChange={(e) => handleInputChange('carpetCleaningItems', e.target.value)}
                      placeholder="Describe carpet cleaning requirements..."
                      className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mattressCleaningItems" className="text-sm font-semibold text-gray-700">Mattress Cleaning Items</Label>
                    <Textarea
                      id="mattressCleaningItems"
                      value={formData.mattressCleaningItems}
                      onChange={(e) => handleInputChange('mattressCleaningItems', e.target.value)}
                      placeholder="Describe mattress cleaning requirements..."
                      className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upholsteryCleaningItems" className="text-sm font-semibold text-gray-700">Upholstery Cleaning Items</Label>
                    <Textarea
                      id="upholsteryCleaningItems"
                      value={formData.upholsteryCleaningItems}
                      onChange={(e) => handleInputChange('upholsteryCleaningItems', e.target.value)}
                      placeholder="Describe upholstery cleaning requirements..."
                      className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="propertyDetails" className="text-sm font-semibold text-gray-700">Property Details</Label>
              <Textarea
                id="propertyDetails"
                value={formData.propertyDetails}
                onChange={(e) => handleInputChange('propertyDetails', e.target.value)}
                placeholder="Bedrooms, bathrooms, special requirements..."
                className="border-2 border-gray-200 focus:border-green-500 transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Address & Access */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <MapPin className="h-6 w-6" />
              Property Address & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <Checkbox
                id="useClientAddress"
                checked={formData.useClientAddress}
                onCheckedChange={handleUseClientAddress}
                className="border-2 border-orange-400"
                disabled={!formData.customerId}
              />
              <Label htmlFor="useClientAddress" className="text-sm font-semibold text-orange-700">
                Use client address for property address
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Property Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="border-2 border-gray-200 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode" className="text-sm font-semibold text-gray-700">Postcode *</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  className="border-2 border-gray-200 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">Property Access *</Label>
                <Dialog open={showAddPropertyAccessDialog} onOpenChange={setShowAddPropertyAccessDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:border-orange-400">
                      <Plus className="h-4 w-4 mr-1" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Property Access Option</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="accessLabel">Label</Label>
                        <Input
                          id="accessLabel"
                          value={newPropertyAccess.label}
                          onChange={(e) => setNewPropertyAccess(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., Concierge service"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accessIcon">Icon (emoji)</Label>
                        <Input
                          id="accessIcon"
                          value={newPropertyAccess.icon}
                          onChange={(e) => setNewPropertyAccess(prev => ({ ...prev, icon: e.target.value }))}
                          placeholder="e.g., 🏨"
                        />
                      </div>
                      <Button onClick={handleAddPropertyAccess} className="w-full">
                        Add Option
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propertyAccessOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105",
                      formData.propertyAccess === option.value
                        ? "bg-gradient-to-r from-orange-400 to-red-400 text-white border-transparent shadow-lg"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleInputChange('propertyAccess', option.value)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </div>
                    {formData.propertyAccess === option.value && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {(formData.propertyAccess === 'estate_agent' || formData.propertyAccess === 'keybox_access' || formData.propertyAccess === 'key_left' || formData.propertyAccess === 'other') && (
              <div className="space-y-4 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-red-600" />
                  <h4 className="font-bold text-lg text-red-700">Key Collection Details</h4>
                </div>
                
                {formData.propertyAccess === 'estate_agent' && (
                  <div className="space-y-4">
                    {/* Option to use client address for business customers - always show if customer is selected */}
                    {formData.customerId && (
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Checkbox
                          id="useClientAddressForKeys"
                          checked={formData.useClientAddressForKeys}
                          onCheckedChange={handleUseClientAddressForKeys}
                        />
                        <Label htmlFor="useClientAddressForKeys" className="text-sm font-medium text-green-700">
                          Use client's address for key pickup
                        </Label>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="keyPickupAddress" className="text-sm font-semibold text-gray-700">Key Pickup Address</Label>
                      <Textarea
                        id="keyPickupAddress"
                        value={formData.keyPickupAddress}
                        onChange={(e) => handleInputChange('keyPickupAddress', e.target.value)}
                        placeholder="Enter estate agent office address..."
                        className="border-2 border-gray-200 focus:border-red-500 transition-colors"
                        disabled={formData.useClientAddressForKeys}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="keyCollectionNotes" className="text-sm font-semibold text-gray-700">
                    Access Notes & Instructions
                  </Label>
                  <Textarea
                    id="keyCollectionNotes"
                    value={formData.keyCollectionNotes}
                    onChange={(e) => handleInputChange('keyCollectionNotes', e.target.value)}
                    placeholder="Enter keybox code, key location, contact details, or any special instructions for property access..."
                    className="border-2 border-gray-200 focus:border-red-500 transition-colors"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment & Cost */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Banknote className="h-6 w-6" />
              Payment & Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Discount Section */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Discount Type</Label>
                <Select 
                  value={formData.discountType} 
                  onValueChange={(value: 'fixed' | 'percentage') => handleInputChange('discountType', value)}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-semibold text-gray-700">
                  Discount {formData.discountType === 'percentage' ? '(%)' : '(£)'}
                </Label>
                <Input
                  id="discount"
                  type="number"
                  step={formData.discountType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discount || ''}
                  onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                  placeholder={formData.discountType === 'percentage' ? '0' : '0.00'}
                  className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalCost" className="text-sm font-semibold text-gray-700">
                  Total Cost (£) {formData.discount > 0 ? '(After discount)' : requiresHours ? '' : '*'}
                </Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalCost}
                  onChange={(e) => handleInputChange('totalCost', parseFloat(e.target.value) || 0)}
                  className={cn(
                    "border-2 border-gray-200 focus:border-indigo-500 transition-colors",
                    requiresHours && "bg-gray-50"
                  )}
                  readOnly={requiresHours}
                  required={!requiresHours}
                />
                {formData.discount > 0 && requiresHours && (
                  <p className="text-xs text-green-600">
                    Original: £{(formData.totalHours * formData.costPerHour).toFixed(2)} - Discount: {formData.discountType === 'percentage' ? `${formData.discount}%` : `£${formData.discount.toFixed(2)}`}
                  </p>
                )}
              </div>
              
              {/* Payment Method - Show dropdown for admin when customer has no payment methods */}
              {!isCustomerView && formData.customerId && !hasPaymentMethods && (
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">
                    Payment Method *
                  </Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-indigo-500">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.length === 0 ? (
                        <SelectItem value="none" disabled>No payment methods configured</SelectItem>
                      ) : (
                        paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-orange-600">
                    Customer has no saved payment methods. Select payment method manually.
                  </p>
                </div>
              )}
              
              {/* Show info message when customer has payment methods */}
              {!isCustomerView && formData.customerId && hasPaymentMethods && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Payment Method</Label>
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ Customer has saved payment methods. Payment will be processed via Stripe.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="paymentStatus" className="text-sm font-semibold text-gray-700">Payment Status</Label>
                <Select value={formData.paymentStatus} onValueChange={(value) => handleInputChange('paymentStatus', value)}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-xl">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="additionalDetails" className="text-sm font-semibold text-gray-700">Special Instructions</Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails}
                onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                placeholder="Any special instructions or requirements..."
                className="border-2 border-gray-200 focus:border-teal-500 transition-colors"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Linen Management - Only for Airbnb */}
        {formData.serviceType === 'airbnb' && (
          <LinenManagementSelector
            enabled={formData.linenManagement}
            onEnabledChange={(enabled) => setFormData(prev => ({ ...prev, linenManagement: enabled, linenUsed: enabled ? prev.linenUsed : [] }))}
            linenUsed={formData.linenUsed}
            onLinenUsedChange={(linenUsed) => setFormData(prev => ({ ...prev, linenUsed }))}
            customerId={formData.customerId || undefined}
          />
        )}

        {/* Email Confirmation Option */}
        {!isCustomerView && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
              <CardTitle className="text-xl">Email Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="sendConfirmationEmail"
                  checked={formData.sendConfirmationEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendConfirmationEmail: checked as boolean }))}
                  className="border-2 border-emerald-300 data-[state=checked]:bg-emerald-600"
                />
                <Label htmlFor="sendConfirmationEmail" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Send booking confirmation email to customer
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-6">
                When enabled, a confirmation email will be automatically sent to the customer with booking details.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cleaner Assignment */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <User className="h-6 w-6" />
              Cleaner Assignment (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <CleanerSelector onCleanerSelect={handleCleanerSelect} />
            
            {formData.cleanerId && (
              <div className="space-y-6 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
                <h4 className="font-bold text-lg text-cyan-700">Cleaner Payment & Rate</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {requiresHours && (
                    <div className="space-y-2">
                      <Label htmlFor="cleanerHourlyRate" className="text-sm font-semibold text-gray-700">Cleaner Hourly Rate (£)</Label>
                      <Input
                        id="cleanerHourlyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cleanerHourlyRate}
                        onChange={(e) => handleInputChange('cleanerHourlyRate', parseFloat(e.target.value) || 0)}
                        className="border-2 border-gray-200 focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  )}
                  {!requiresHours && (
                    <div className="space-y-2">
                      <Label htmlFor="cleanerPercentage" className="text-sm font-semibold text-gray-700">Cleaner Percentage (%)</Label>
                      <Input
                        id="cleanerPercentage"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={formData.cleanerPercentage}
                        onChange={(e) => handleInputChange('cleanerPercentage', parseFloat(e.target.value) || 0)}
                        className="border-2 border-gray-200 focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="cleanerPay" className="text-sm font-semibold text-gray-700">Cleaner Pay (£)</Label>
                    <Input
                      id="cleanerPay"
                      type="number"
                      step="0.01"
                      value={formData.cleanerPay}
                      onChange={(e) => handleInputChange('cleanerPay', parseFloat(e.target.value) || 0)}
                      className="bg-gray-50 border-2 border-gray-200"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Submit Buttons */}
        <div className="flex justify-center space-x-4 pb-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onBookingCreated()}
            className="px-6 py-3 text-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {loading ? 'Creating Booking...' : 'Create Booking'}
          </Button>
        </div>
      </form>
    </div>
    </>
  );
};

export default NewBookingForm;
