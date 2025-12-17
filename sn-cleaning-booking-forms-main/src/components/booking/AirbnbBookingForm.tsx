import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PropertyStep } from './steps/PropertyStep';
import { LinensStep } from './steps/LinensStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { BookingSummary } from './AirbnbBookingSummary';
import { PaymentStep } from './steps/PaymentStep';
import { Home, Brush, Calendar, User, CreditCard, Package2, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuoteLeadTracking } from '@/hooks/useQuoteLeadTracking';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
export interface BookingData {
  // Property details
  propertyType: 'flat' | 'house' | '';
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  
  // Additional rooms (for 2+ bedrooms)
  additionalRooms: {
    toilets: number;
    studyRooms: number;
    utilityRooms: number;
    otherRooms: number;
  };
  
  // Property features
  propertyFeatures: {
    separateKitchen: boolean;
    livingRoom: boolean;
    diningRoom: boolean;
  };
  numberOfFloors: number;
  
  // Service details
  serviceType: 'checkin-checkout' | 'midstay' | 'light' | 'deep' | '';
  alreadyCleaned: boolean | null;
  hasOvenCleaning: boolean;
  ovenType: string;
  cleaningProducts: string[]; // Array to support multi-select: ['no'] or ['products', 'equipment']
  equipmentArrangement: 'oneoff' | 'ongoing' | null;
  equipmentStorageConfirmed: boolean;
  
  // Linens
  linensHandling: 'customer-handles' | 'wash-hang' | 'wash-dry' | 'order-linens' | '';
  needsIroning: boolean | null;
  ironingHours: number;
  linenPackages: Record<string, number>;
  bedSizes: Record<string, number>;
  extraHours: number;
  
  // Schedule
  selectedDate: Date | null;
  selectedTime: string;
  flexibility: 'not-flexible' | 'flexible-time' | 'flexible-date' | '';
  notes: string;
  additionalDetails: string;
  sameDayTurnaround: boolean;
  shortNoticeCharge?: number;
  
  // Contact
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  propertyAccess: string;
  accessNotes: string;
  
  // Calculations
  estimatedHours: number | null;
  estimatedAdditionalHours?: number | null;
  totalHours?: number;
  hourlyRate: number;
  totalCost: number;
  
  // Admin pricing overrides
  adminDiscountAmount?: number;
  adminDiscountPercentage?: number;
  adminHourlyRateOverride?: number;
  adminTotalCostOverride?: number;
  adminRemoveShortNoticeCharge?: boolean;
  
  // Admin payment control
  stripeChargeTiming?: 'immediate' | 'authorize' | 'none';
  
  // Admin/Customer specific fields
  customerId?: number;
  selectedCustomer?: any;
  addressId?: string;
  selectedAddress?: any;
  paymentMethod?: string;
  cleanerId?: number; // Cleaner assignment
}

const steps = [
  { id: 1, title: 'Property', key: 'property', icon: <Home className="w-4 h-4" /> },
  { id: 2, title: 'Linens', key: 'linens', icon: <Package2 className="w-4 h-4" /> },
  { id: 3, title: 'Schedule', key: 'schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 4, title: 'Summary', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const AirbnbBookingForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  
  // Quote lead tracking
  const { saveQuoteLead, trackStep, trackQuoteCalculated, markCompleted } = useQuoteLeadTracking('Air BnB');
  
  const [bookingData, setBookingData] = useState<BookingData>({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    toilets: '0',
    additionalRooms: {
      toilets: 0,
      studyRooms: 0,
      utilityRooms: 0,
      otherRooms: 0,
    },
    propertyFeatures: {
      separateKitchen: false,
      livingRoom: false,
      diningRoom: false,
    },
    numberOfFloors: 0,
    serviceType: '',
    alreadyCleaned: null,
    hasOvenCleaning: false,
    ovenType: '',
    cleaningProducts: [],
    equipmentArrangement: null,
    equipmentStorageConfirmed: false,
    linensHandling: '',
    needsIroning: null,
    ironingHours: 0,
    linenPackages: {},
    bedSizes: {},
    extraHours: 0,
    selectedDate: null,
    selectedTime: '',
    flexibility: '',
    notes: '',
    additionalDetails: '',
    sameDayTurnaround: false,
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    houseNumber: '',
    street: '',
    postcode: '',
    city: '',
    propertyAccess: '',
    accessNotes: '',
    estimatedHours: null, // Start with null instead of 0
    estimatedAdditionalHours: null,
    hourlyRate: 25,
    totalCost: 0,
  });

  // Check if user is admin AND on admin route, and load customer ID for logged-in customers
  useEffect(() => {
    const checkAdminAndLoadCustomer = async () => {
      // Only enable admin mode if on /admin/ route
      const isAdminRoute = location.pathname.includes('/admin/');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user is admin
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        const isAdminOrSalesAgent = role?.role === 'admin' || role?.role === 'sales_agent';
        setIsAdminMode(isAdminOrSalesAgent && isAdminRoute);
        
        // If not on admin route (customer booking), always load customer profile
        if (!isAdminRoute) {
          // First try to get customer from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('customer_id')
            .eq('user_id', session.user.id)
            .single();
          
          console.log('[AirbnbBookingForm] Loading customer profile:', profile);
          
          let customerId = profile?.customer_id;
          
          // If no customer_id in profile, try to find customer by email
          if (!customerId) {
            console.log('[AirbnbBookingForm] No customer_id in profile, searching by email:', session.user.email);
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('email', session.user.email)
              .single();
            
            customerId = customer?.id;
            console.log('[AirbnbBookingForm] Found customer by email:', customerId);
            
            // Update profile with customer_id if found
            if (customerId) {
              await supabase
                .from('profiles')
                .update({ customer_id: customerId })
                .eq('user_id', session.user.id);
              console.log('[AirbnbBookingForm] Updated profile with customer_id');
            }
          }
          
          if (customerId) {
            console.log('[AirbnbBookingForm] Setting customer ID:', customerId);
            setBookingData(prev => ({
              ...prev,
              customerId: customerId
            }));
          } else {
            console.warn('[AirbnbBookingForm] No customer found for user:', session.user.email);
          }
        }
      } else {
        setIsAdminMode(false);
      }
    };
    checkAdminAndLoadCustomer();
  }, [location.pathname]);

  // Load Stripe on mount
  useEffect(() => {
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('stripe-get-publishable-key');
        if (error) throw error;
        if (data?.publishable_key) {
          setStripePromise(loadStripe(data.publishable_key));
        }
      } catch (error) {
        console.error('Failed to load Stripe:', error);
      }
    };
    initStripe();
  }, []);

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => {
      // Detect fields that affect time calculations
      const timeAffectingKeys: (keyof BookingData)[] = [
        'propertyType', 'bedrooms', 'bathrooms', 'toilets', 'additionalRooms', 'propertyFeatures',
        'numberOfFloors', 'serviceType', 'alreadyCleaned', 'ovenType', 'linensHandling',
        'needsIroning', 'ironingHours', 'bedSizes'
      ];
      const affectsTime = Object.keys(updates).some(k => timeAffectingKeys.includes(k as keyof BookingData));

      const newData = { ...prev, ...updates };

      // If a time-affecting field changed and user didn't explicitly set estimatedHours now, reset it
      if (affectsTime && updates.estimatedHours === undefined) {
        newData.estimatedHours = null;
      }
      
      // Recalculate costs when relevant data changes explicitly
      if ('estimatedHours' in updates || 'extraHours' in updates) {
        const estimatedHours = newData.estimatedHours ?? 0;
        const extraHours = newData.extraHours ?? 0;
        const totalHours = estimatedHours + extraHours;
        newData.totalCost = totalHours * newData.hourlyRate;
        
        // Track quote when price is calculated
        if (totalHours > 0 && !isAdminMode) {
          trackQuoteCalculated(totalHours * newData.hourlyRate, totalHours, {
            cleaningType: newData.serviceType || undefined,
            propertyType: newData.propertyType || undefined,
            bedrooms: newData.bedrooms ? parseInt(newData.bedrooms) : undefined,
            bathrooms: newData.bathrooms ? parseInt(newData.bathrooms) : undefined,
            toilets: newData.toilets ? parseInt(newData.toilets) : undefined,
            ovenCleaning: newData.hasOvenCleaning,
            ovenSize: newData.ovenType || undefined,
            ironingHours: newData.ironingHours || undefined,
            postcode: newData.postcode || undefined,
          });
        }
      }
      
      // Track contact info updates
      if (!isAdminMode && ('firstName' in updates || 'email' in updates || 'phone' in updates || 'postcode' in updates)) {
        saveQuoteLead({
          firstName: newData.firstName || undefined,
          lastName: newData.lastName || undefined,
          email: newData.email || undefined,
          phone: newData.phone || undefined,
          postcode: newData.postcode || undefined,
        });
      }
      
      return newData;
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      const stepName = steps[currentStep - 1]?.key || `step_${currentStep}`;
      if (!isAdminMode) {
        trackStep(stepName, {
          cleaningType: bookingData.serviceType || undefined,
          propertyType: bookingData.propertyType || undefined,
          bedrooms: bookingData.bedrooms ? parseInt(bookingData.bedrooms) : undefined,
          calculatedQuote: bookingData.totalCost || undefined,
        });
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  const handleSendQuote = async () => {
    const email = bookingData.email || bookingData.selectedCustomer?.email;
    if (!email || !email.includes('@')) {
      toast({
        title: "Email Required",
        description: "Please enter a valid customer email address to send the quote.",
        variant: "destructive",
      });
      return;
    }

    setSendingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-quote-email', {
        body: {
          customerName: `${bookingData.firstName || bookingData.selectedCustomer?.first_name || ''} ${bookingData.lastName || bookingData.selectedCustomer?.last_name || ''}`.trim() || 'Valued Customer',
          customerEmail: email,
          serviceType: 'Air BnB',
          cleaningType: bookingData.serviceType,
          propertyDetails: `${bookingData.bedrooms} bed, ${bookingData.bathrooms} bath`,
          address: bookingData.selectedAddress?.address || `${bookingData.houseNumber} ${bookingData.street}, ${bookingData.postcode}`,
          selectedDate: bookingData.selectedDate?.toISOString(),
          selectedTime: bookingData.selectedTime,
          totalCost: bookingData.totalCost,
          estimatedHours: bookingData.estimatedHours,
          hourlyRate: bookingData.hourlyRate,
          referrer: window.location.href,
        },
      });

      if (error) throw error;

      setShowQuoteDialog(false);
      toast({
        title: "Quote Sent!",
        description: `Quote email sent successfully to ${email}`,
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PropertyStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <LinensStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <ScheduleStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentStep
              data={bookingData}
              onUpdate={updateBookingData}
              onBack={prevStep}
              isAdminMode={isAdminMode}
            />
          </Elements>
        ) : (
          <div className="text-center py-8">Loading payment form...</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white py-4 mb-3 border-b border-border shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between mb-4">
            {isAdminMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin-add-booking')}
                  className="text-sm font-medium hover:bg-accent/50 transition-all duration-200 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Services
                </Button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700">
                  Airbnb Cleaning Booking Form
                </h1>
                <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-sm font-medium border-amber-500 text-amber-600 hover:bg-amber-50 transition-all duration-200 shadow-sm"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send as Quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-sm text-amber-800">
                          A quote email will be sent to: <strong>{bookingData.email || bookingData.selectedCustomer?.email || 'No email set'}</strong>
                        </p>
                        <p className="text-sm text-amber-700 mt-2">
                          Total: <strong>£{bookingData.totalCost?.toFixed(2) || '0.00'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
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
                  </DialogContent>
                </Dialog>
              </>
            ) : bookingData.customerId ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="text-sm font-medium hover:bg-accent/50 transition-all duration-200 shadow-sm"
                >
                  ← Back to Account
                </Button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700">
                  Airbnb Cleaning Booking Form
                </h1>
                <div className="w-[140px]" />
              </>
            ) : (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 mx-auto">
                Airbnb Cleaning Booking Form
              </h1>
            )}
          </div>
          
          {/* Step Navigation - Mobile Optimized */}
          <div className="max-w-4xl mx-auto">
            {/* Compact stepper with progress */}
            <div className="flex items-center justify-center gap-1 px-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                
                return (
                  <div key={step.id} className="contents">
                    <button
                      onClick={() => (isCompleted || stepNumber <= currentStep) && setCurrentStep(stepNumber)}
                      disabled={!(isCompleted || stepNumber <= currentStep)}
                      className={`flex flex-col items-center justify-center transition-all duration-300 ${
                        isActive ? 'flex-1' : 'w-12'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-primary text-white scale-110' 
                          : isCompleted 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {stepNumber}
                      </div>
                      {isActive && (
                        <span className="text-xs sm:text-sm font-medium text-primary mt-1 text-center">
                          {step.title}
                        </span>
                      )}
                    </button>
                    
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 max-w-[20px] sm:max-w-[30px] transition-all ${
                        currentStep > stepNumber ? 'bg-primary' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-2 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Form Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 lg:p-8 bg-white transition-shadow duration-300 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
              {renderStep()}
            </Card>
          </div>
          
          {/* Summary Section - Takes 1 column, always visible */}
          <div className="lg:col-span-1">
            <BookingSummary 
              data={bookingData} 
              isAdminMode={isAdminMode}
              onUpdate={updateBookingData}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AirbnbBookingForm;