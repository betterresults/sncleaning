import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EndOfTenancyPropertyStep } from './steps/EndOfTenancyPropertyStep';
import { EndOfTenancyExtrasStep } from './steps/EndOfTenancyExtrasStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { EndOfTenancySummary } from './EndOfTenancySummary';
import { PaymentStep } from './steps/PaymentStep';
import { ExitQuotePopup } from '@/components/booking/ExitQuotePopup';
import { Home, Sparkles, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuoteLeadTracking } from '@/hooks/useQuoteLeadTracking';
import { CarpetCleaningItem } from './CarpetCleaningForm';

export interface EndOfTenancyBookingData {
  // Property details - Step 1
  propertyType: 'flat' | 'house' | 'house-share' | '';
  bedrooms: string;
  bathrooms: string;
  propertyCondition: 'well-maintained' | 'moderate' | 'heavily-used' | 'intensive' | '';
  furnitureStatus: 'furnished' | 'unfurnished' | 'part-furnished' | '';
  kitchenLivingSeparate: boolean | null;
  additionalRooms: string[];
  ovenType: string;
  
  // House share specific
  houseShareAreas: string[];
  
  // Extras - Step 2
  blindsItems: { type: string; quantity: number; price: number }[];
  extraServices: { id: string; name: string; quantity: number; price: number }[];
  
  // Steam cleaning add-ons
  wantsSteamCleaning: boolean;
  carpetItems: CarpetCleaningItem[];
  upholsteryItems: CarpetCleaningItem[];
  mattressItems: CarpetCleaningItem[];
  
  // Schedule - Step 3
  selectedDate: Date | null;
  selectedTime: string;
  flexibility: 'not-flexible' | 'flexible-time' | 'flexible-date' | '';
  notes: string;
  additionalDetails: string;
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
  hourlyRate: number;
  totalCost: number;
  isFirstTimeCustomer?: boolean;
  
  // Admin pricing overrides
  adminDiscountAmount?: number;
  adminDiscountPercentage?: number;
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
  cleanerId?: number;
}

// Pricing constants
const BASE_HOURS_MAP: Record<string, Record<string, number>> = {
  studio: { '1': 3, '2': 3.5 },
  '1': { '1': 4, '2': 4.5 },
  '2': { '1': 5, '2': 5.5, '3': 6 },
  '3': { '1': 6, '2': 6.5, '3': 7, '4': 7.5 },
  '4': { '1': 7, '2': 7.5, '3': 8, '4': 8.5 },
  '5': { '1': 8, '2': 8.5, '3': 9, '4': 9.5, '5': 10 },
  '6+': { '1': 9, '2': 10, '3': 11, '4': 12, '5': 13, '6+': 14 },
};

const HOURLY_RATE = 28;

// Note: Oven prices are fetched from database via useEndOfTenancyCalculations hook
// The calculateTotals function below is a quick estimate - actual totals come from the hook

const steps = [
  { id: 1, title: 'Property', key: 'property', icon: <Home className="w-4 h-4" /> },
  { id: 2, title: 'Extras', key: 'extras', icon: <Sparkles className="w-4 h-4" /> },
  { id: 3, title: 'Schedule', key: 'schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 4, title: 'Summary', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const EndOfTenancyBookingForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  
  const [bookingData, setBookingData] = useState<EndOfTenancyBookingData>({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    propertyCondition: '',
    furnitureStatus: '',
    kitchenLivingSeparate: null,
    additionalRooms: [],
    ovenType: '',
    houseShareAreas: [],
    blindsItems: [],
    extraServices: [],
    wantsSteamCleaning: false,
    carpetItems: [],
    upholsteryItems: [],
    mattressItems: [],
    selectedDate: null,
    selectedTime: '',
    flexibility: '',
    notes: '',
    additionalDetails: '',
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
    estimatedHours: null,
    hourlyRate: HOURLY_RATE,
    totalCost: 0,
    isFirstTimeCustomer: true, // Default to true for new customers - will be checked against DB later
  });

  // Calculate totals - this is a quick estimate for tracking purposes
  // Actual totals are calculated by useEndOfTenancyCalculations hook in EndOfTenancySummary
  const calculateTotals = useCallback((data: EndOfTenancyBookingData) => {
    const bedrooms = data.bedrooms || '1';
    const bathrooms = data.bathrooms || '1';
    
    const bedroomMap = BASE_HOURS_MAP[bedrooms] || BASE_HOURS_MAP['1'];
    const baseHours = bedroomMap[bathrooms] || bedroomMap['1'] || 4;
    
    const baseCost = baseHours * HOURLY_RATE;
    // Note: Oven and other costs are calculated from database in the summary component
    
    // Blinds total
    const blindsTotal = data.blindsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Extra services total
    const extrasTotal = data.extraServices.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const steamCleaningTotal = 
      data.carpetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
      data.upholsteryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
      data.mattressItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const shortNoticeCharge = data.shortNoticeCharge || 0;
    
    return {
      estimatedHours: baseHours,
      totalCost: baseCost + blindsTotal + extrasTotal + steamCleaningTotal + shortNoticeCharge,
    };
  }, []);

  // Initialize tracking using the shared hook
  const { saveQuoteLead, markCompleted, sessionId } = useQuoteLeadTracking('End of Tenancy', {
    isAdminMode,
    adminId: adminUserId || undefined,
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Check if user is admin AND on admin route
  useEffect(() => {
    const checkAdminAndLoadCustomer = async () => {
      const isAdminRoute = location.pathname.includes('/admin/');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        const isAdminOrSalesAgent = role?.role === 'admin' || role?.role === 'sales_agent';
        const adminMode = isAdminOrSalesAgent && isAdminRoute;
        setIsAdminMode(adminMode);
        if (adminMode) {
          setAdminUserId(session.user.id);
        }
        
        if (!isAdminRoute) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('customer_id')
            .eq('user_id', session.user.id)
            .single();
          
          let customerId = profile?.customer_id;
          
          if (!customerId) {
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('email', session.user.email)
              .single();
            
            customerId = customer?.id;
            
            if (customerId) {
              await supabase
                .from('profiles')
                .update({ customer_id: customerId })
                .eq('user_id', session.user.id);
            }
          }
          
          if (customerId) {
            // Check if customer has any past bookings
            const { data: pastBookings } = await supabase
              .from('past_bookings')
              .select('id')
              .eq('customer', customerId)
              .limit(1);
            
            const { data: currentBookings } = await supabase
              .from('bookings')
              .select('id')
              .eq('customer', customerId)
              .limit(1);
            
            const hasPreviousBookings = (pastBookings && pastBookings.length > 0) || (currentBookings && currentBookings.length > 0);
            
            setBookingData(prev => ({
              ...prev,
              customerId: customerId,
              isFirstTimeCustomer: !hasPreviousBookings // Not first time if they have previous bookings
            }));
          }
        }
      } else {
        // Not logged in = new customer, eligible for discount
        setIsAdminMode(false);
        setBookingData(prev => ({
          ...prev,
          isFirstTimeCustomer: true
        }));
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

  const updateBookingData = useCallback((updates: Partial<EndOfTenancyBookingData>) => {
    setBookingData(prev => {
      const newData = { ...prev, ...updates };
      
      // Recalculate totals
      const { estimatedHours, totalCost } = calculateTotals(newData);
      newData.estimatedHours = estimatedHours;
      newData.totalCost = totalCost;
      
      // Save to tracking (non-admin only)
      if (!isAdminMode) {
        const stepNames = ['property', 'extras', 'schedule', 'payment'];
        const stepName = stepNames[currentStep - 1] || 'property';
        saveQuoteLead({
          serviceType: 'End of Tenancy',
          propertyType: newData.propertyType,
          bedrooms: newData.bedrooms ? (newData.bedrooms === 'studio' ? 0 : parseInt(newData.bedrooms)) : undefined,
          bathrooms: newData.bathrooms ? parseInt(newData.bathrooms) : undefined,
          ovenSize: newData.ovenType,
          calculatedQuote: newData.totalCost,
          selectedDate: newData.selectedDate || undefined,
          selectedTime: newData.selectedTime,
          firstName: newData.firstName,
          lastName: newData.lastName,
          email: newData.email,
          phone: newData.phone,
          postcode: newData.postcode,
          furthestStep: stepName,
          shortNoticeCharge: newData.shortNoticeCharge,
        });
      }
      return newData;
    });
  }, [currentStep, isAdminMode, saveQuoteLead, calculateTotals]);

  // Handle browser back button to show exit popup
  useEffect(() => {
    if (isAdminMode) return;
    
    const handlePopState = (e: PopStateEvent) => {
      if (bookingData.totalCost > 0) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        setShowExitPopup(true);
      }
    };
    
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdminMode, bookingData.totalCost]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EndOfTenancyPropertyStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            isAdminMode={isAdminMode}
          />
        );
      case 2:
        return (
          <EndOfTenancyExtrasStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <ScheduleStep
            data={bookingData as any}
            onUpdate={updateBookingData as any}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentStep
              data={{
                ...bookingData,
                linens: { provided: false, quantity: 0, type: '' },
                calculatedCleaningCost: bookingData.totalCost,
                calculatedLinenCost: 0,
              } as any}
              onUpdate={updateBookingData as any}
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
      <header className="bg-white py-4 mb-3 border-b border-border">
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
                  Back
                </Button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 whitespace-nowrap">
                  <span className="sm:hidden">End of Tenancy</span>
                  <span className="hidden sm:inline">End of Tenancy Cleaning</span>
                </h1>
                <div className="w-[140px]" />
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 whitespace-nowrap">
                  <span className="sm:hidden">End of Tenancy</span>
                  <span className="hidden sm:inline">End of Tenancy Cleaning</span>
                </h1>
                <div className="w-[140px]" />
              </>
            ) : (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 mx-auto whitespace-nowrap">
                <span className="sm:hidden">End of Tenancy</span>
                <span className="hidden sm:inline">End of Tenancy Cleaning</span>
              </h1>
            )}
          </div>
          
          {/* Step Navigation */}
          <div className="max-w-4xl mx-auto">
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
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 lg:p-8 bg-white border border-border">
              {renderStep()}
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border-2 border-slate-200 shadow-lg lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none lg:rounded-none">
                <h3 className="text-lg font-bold text-slate-700 mb-3 lg:hidden">Booking Summary</h3>
                <EndOfTenancySummary 
                  data={bookingData} 
                  isAdminMode={isAdminMode}
                  onUpdate={updateBookingData}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Exit Quote Popup - using the shared component */}
      <ExitQuotePopup
        open={showExitPopup}
        onOpenChange={setShowExitPopup}
        email={bookingData.email}
        sessionId={sessionId}
        serviceType="End of Tenancy"
        quoteData={{
          totalCost: bookingData.totalCost,
          estimatedHours: bookingData.estimatedHours,
          propertyType: bookingData.propertyType,
          bedrooms: bookingData.bedrooms,
          bathrooms: bookingData.bathrooms,
          serviceFrequency: '',
          hasOvenCleaning: !!bookingData.ovenType,
          ovenType: bookingData.ovenType,
          selectedDate: bookingData.selectedDate,
          selectedTime: bookingData.selectedTime,
          postcode: bookingData.postcode,
          shortNoticeCharge: bookingData.shortNoticeCharge,
          carpetItems: bookingData.carpetItems,
          upholsteryItems: bookingData.upholsteryItems,
          mattressItems: bookingData.mattressItems,
        }}
        onSaveEmail={(email) => {
          updateBookingData({ email });
        }}
      />
    </div>
  );
};

export default EndOfTenancyBookingForm;
