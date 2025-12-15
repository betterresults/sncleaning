import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DomesticPropertyStep } from './steps/DomesticPropertyStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { DomesticBookingSummary } from './DomesticBookingSummary';
import { PaymentStep } from './steps/PaymentStep';
import { Home, Calendar, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuoteLeadTracking } from '@/hooks/useQuoteLeadTracking';
import { ExitQuotePopup } from '@/components/booking/ExitQuotePopup';

export interface DomesticBookingData {
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
  
  // Service details - Domestic specific
  serviceFrequency: 'weekly' | 'biweekly' | 'monthly' | 'onetime' | '';
  daysPerWeek: number;
  wantsFirstDeepClean: boolean;
  hasOvenCleaning: boolean;
  ovenType: string;
  ovenCleaningScope: 'this-booking' | 'all-bookings';
  cleaningProducts: string[];
  equipmentArrangement: 'oneoff' | 'ongoing' | null;
  equipmentStorageConfirmed: boolean;
  
  // Schedule
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
  cleanerId?: number;
  
  // First-time customer discount
  isFirstTimeCustomer?: boolean;
}

const steps = [
  { id: 1, title: 'Property', key: 'property', icon: <Home className="w-4 h-4" /> },
  { id: 2, title: 'Schedule', key: 'schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 3, title: 'Summary', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const DomesticBookingForm: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  
  // Quote lead tracking
  const { saveQuoteLead, trackStep, trackQuoteCalculated, markCompleted, initializeFromResume, markQuoteEmailSent, sessionId } = useQuoteLeadTracking('Domestic');
  
  const [bookingData, setBookingData] = useState<DomesticBookingData>({
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
    serviceFrequency: '',
    daysPerWeek: 1,
    wantsFirstDeepClean: false,
    hasOvenCleaning: false,
    ovenType: '',
    ovenCleaningScope: 'this-booking',
    cleaningProducts: [],
    equipmentArrangement: null,
    equipmentStorageConfirmed: false,
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
    estimatedAdditionalHours: null,
    hourlyRate: 22,
    totalCost: 0,
    isFirstTimeCustomer: true, // Default to true for new customers - will be checked against DB later
  });

  // Resume from saved quote lead OR prefill from URL parameters
  useEffect(() => {
    const resumeSessionId = searchParams.get('resume');
    
    // Check for URL parameter prefilling (from exit popup email)
    const hasUrlPrefill = searchParams.get('propertyType') || searchParams.get('bedrooms') || searchParams.get('postcode');
    
    if (hasUrlPrefill) {
      // Prefill from URL parameters (works across devices)
      console.log('Prefilling from URL parameters');
      
      const propertyType = searchParams.get('propertyType') as 'flat' | 'house' | '' || '';
      const bedrooms = searchParams.get('bedrooms') || '';
      const bathrooms = searchParams.get('bathrooms') || '';
      const frequency = searchParams.get('frequency') as 'weekly' | 'biweekly' | 'monthly' | 'onetime' | '' || '';
      const postcode = searchParams.get('postcode') || '';
      const hasOven = searchParams.get('oven') === '1';
      const ovenType = searchParams.get('ovenType') || '';
      const dateStr = searchParams.get('date');
      const time = searchParams.get('time') || '';
      const email = searchParams.get('email') || '';
      const refSessionId = searchParams.get('ref');
      
      setBookingData(prev => ({
        ...prev,
        propertyType: propertyType || prev.propertyType,
        bedrooms: bedrooms || prev.bedrooms,
        bathrooms: bathrooms || prev.bathrooms,
        serviceFrequency: frequency || prev.serviceFrequency,
        postcode: postcode || prev.postcode,
        hasOvenCleaning: hasOven || prev.hasOvenCleaning,
        ovenType: ovenType || prev.ovenType,
        selectedDate: dateStr ? new Date(dateStr) : prev.selectedDate,
        selectedTime: time || prev.selectedTime,
        email: email || prev.email,
      }));
      
      // Initialize tracking with ref session if available
      if (refSessionId) {
        initializeFromResume(refSessionId);
      }
      
      return;
    }
    
    if (!resumeSessionId) return;

    const loadResumeData = async () => {
      setIsLoadingResume(true);
      try {
        const { data, error } = await supabase
          .from('quote_leads')
          .select('*')
          .eq('session_id', resumeSessionId)
          .single();

        if (error || !data) {
          console.log('No resume data found for session:', resumeSessionId);
          return;
        }

        console.log('Loading resume data:', data);

        // Map quote_leads data to bookingData format
        setBookingData(prev => ({
          ...prev,
          propertyType: (data.property_type as 'flat' | 'house' | '') || prev.propertyType,
          bedrooms: data.bedrooms?.toString() || prev.bedrooms,
          bathrooms: data.bathrooms?.toString() || prev.bathrooms,
          toilets: data.toilets?.toString() || prev.toilets,
          serviceFrequency: (data.frequency as 'weekly' | 'biweekly' | 'monthly' | 'onetime' | '') || prev.serviceFrequency,
          hasOvenCleaning: data.oven_cleaning || prev.hasOvenCleaning,
          ovenType: data.oven_size || prev.ovenType,
          selectedDate: data.selected_date ? new Date(data.selected_date) : prev.selectedDate,
          selectedTime: data.selected_time || prev.selectedTime,
          firstName: data.first_name || prev.firstName,
          lastName: data.last_name || prev.lastName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          postcode: data.postcode || prev.postcode,
          estimatedHours: data.recommended_hours || prev.estimatedHours,
          isFirstTimeCustomer: data.is_first_time_customer ?? prev.isFirstTimeCustomer,
          additionalRooms: data.additional_rooms ? (typeof data.additional_rooms === 'object' ? data.additional_rooms as any : prev.additionalRooms) : prev.additionalRooms,
        }));

        // Use the hook's initialize function to set session ID properly in localStorage
        initializeFromResume(resumeSessionId);

      } catch (err) {
        console.error('Error loading resume data:', err);
      } finally {
        setIsLoadingResume(false);
      }
    };

    loadResumeData();
  }, [searchParams]);

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
        
        const isAdmin = role?.role === 'admin';
        setIsAdminMode(isAdmin && isAdminRoute);
        
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
            setBookingData(prev => ({
              ...prev,
              customerId: customerId
            }));
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

  const updateBookingData = (updates: Partial<DomesticBookingData>) => {
    setBookingData(prev => {
      const timeAffectingKeys: (keyof DomesticBookingData)[] = [
        'propertyType', 'bedrooms', 'bathrooms', 'toilets', 'additionalRooms', 'propertyFeatures',
        'numberOfFloors', 'serviceFrequency', 'ovenType'
      ];
      const affectsTime = Object.keys(updates).some(k => timeAffectingKeys.includes(k as keyof DomesticBookingData));

      const newData = { ...prev, ...updates };

      if (affectsTime && updates.estimatedHours === undefined) {
        newData.estimatedHours = null;
      }
      
      if ('estimatedHours' in updates) {
        const estimatedHours = newData.estimatedHours ?? 0;
        newData.totalCost = estimatedHours * newData.hourlyRate;
      }
      
      // Track when totalCost is updated (this is the FINAL calculated cost from summary)
      if ('totalCost' in updates && updates.totalCost && updates.totalCost > 0 && !isAdminMode) {
        // Calculate discount amount for tracking
        const baseCost = (newData.estimatedHours ?? 0) * newData.hourlyRate;
        const discountAmount = newData.isFirstTimeCustomer ? updates.totalCost * 0.15 / 0.85 : 0; // Reverse calculate the 15% discount
        
        trackQuoteCalculated(updates.totalCost, newData.estimatedHours ?? undefined, {
          propertyType: newData.propertyType || undefined,
          bedrooms: newData.bedrooms ? parseInt(newData.bedrooms) : undefined,
          bathrooms: newData.bathrooms ? parseInt(newData.bathrooms) : undefined,
          toilets: newData.toilets ? parseInt(newData.toilets) : undefined,
          frequency: newData.serviceFrequency || undefined,
          ovenCleaning: newData.hasOvenCleaning,
          ovenSize: newData.ovenType || undefined,
          postcode: newData.postcode || undefined,
          weeklyCost: updates.totalCost, // This is the per-visit cost shown
          discountAmount: discountAmount > 0 ? Math.round(discountAmount * 100) / 100 : undefined,
          shortNoticeCharge: newData.shortNoticeCharge || undefined,
          isFirstTimeCustomer: newData.isFirstTimeCustomer,
        });
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

  // Handle browser back button to show exit popup
  useEffect(() => {
    if (isAdminMode) return;
    
    // Push a state so we can detect back button
    window.history.pushState({ booking: true }, '');
    
    const handlePopState = (e: PopStateEvent) => {
      const emailAlreadySent = sessionStorage.getItem('quote_email_sent') === 'true';
      
      // If quote was already sent, allow navigation
      if (emailAlreadySent) {
        return;
      }
      
      if (bookingData.totalCost > 0) {
        // Prevent immediate navigation
        window.history.pushState({ booking: true }, '');
        setShowExitPopup(true);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdminMode, bookingData.totalCost]);

  // Also detect page visibility change (switching tabs/minimizing) - only show once per session
  useEffect(() => {
    if (isAdminMode) return;
    
    const handleVisibilityChange = () => {
      const alreadyShownThisSession = sessionStorage.getItem('exit_popup_shown') === 'true';
      const emailAlreadySent = sessionStorage.getItem('quote_email_sent') === 'true';
      
      if (document.hidden && bookingData.totalCost > 0 && !alreadyShownThisSession && !emailAlreadySent && currentStep > 1) {
        sessionStorage.setItem('exit_popup_pending', 'true');
      }
      if (!document.hidden && sessionStorage.getItem('exit_popup_pending') === 'true' && !showExitPopup) {
        sessionStorage.removeItem('exit_popup_pending');
        sessionStorage.setItem('exit_popup_shown', 'true');
        setShowExitPopup(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAdminMode, bookingData.totalCost, currentStep, showExitPopup]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      const nextStepKey = steps[currentStep]?.key || `step_${currentStep + 1}`;
      if (!isAdminMode) {
        trackStep(nextStepKey, {
          propertyType: bookingData.propertyType || undefined,
          bedrooms: bookingData.bedrooms ? parseInt(bookingData.bedrooms) : undefined,
          calculatedQuote: bookingData.totalCost || undefined,
        });
      }
      setCurrentStep(currentStep + 1);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DomesticPropertyStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <ScheduleStep
            data={bookingData as any}
            onUpdate={updateBookingData as any}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentStep
              data={bookingData as any}
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
            {!isAdminMode && bookingData.customerId && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="text-sm font-medium hover:bg-accent/50 transition-all duration-200 shadow-sm"
              >
                ← Back to Account
              </Button>
            )}
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 ${!isAdminMode && bookingData.customerId ? '' : 'mx-auto'}`}>
              <span className="sm:hidden">Domestic Cleaning</span>
              <span className="hidden sm:inline">Domestic Cleaning Booking Form</span>
            </h1>
            {!isAdminMode && bookingData.customerId && <div className="w-[140px]" />}
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
              {isLoadingResume ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading your saved quote...</p>
                </div>
              ) : (
                renderStep()
              )}
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border-2 border-slate-200 shadow-lg lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none lg:rounded-none">
                <h3 className="text-lg font-bold text-slate-700 mb-3 lg:hidden">Booking Summary</h3>
                <DomesticBookingSummary 
                  data={bookingData} 
                  isAdminMode={isAdminMode}
                  onUpdate={updateBookingData}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Exit Quote Popup */}
      <ExitQuotePopup
        open={showExitPopup}
        onOpenChange={setShowExitPopup}
        email={bookingData.email}
        quoteData={{
          totalCost: bookingData.totalCost,
          estimatedHours: bookingData.estimatedHours,
          propertyType: bookingData.propertyType,
          bedrooms: bookingData.bedrooms,
          bathrooms: bookingData.bathrooms,
          serviceFrequency: bookingData.serviceFrequency,
          hasOvenCleaning: bookingData.hasOvenCleaning,
          ovenType: bookingData.ovenType,
          selectedDate: bookingData.selectedDate,
          selectedTime: bookingData.selectedTime,
          postcode: bookingData.postcode,
          shortNoticeCharge: bookingData.shortNoticeCharge,
          isFirstTimeCustomer: bookingData.isFirstTimeCustomer,
          discountAmount: bookingData.isFirstTimeCustomer ? bookingData.totalCost * 0.15 / 0.85 : 0,
        }}
        sessionId={sessionId}
        serviceType="Domestic"
        onSaveEmail={(email) => {
          markQuoteEmailSent(email);
          updateBookingData({ email });
          sessionStorage.setItem('quote_email_sent', 'true');
        }}
      />
    </div>
  );
};

export default DomesticBookingForm;