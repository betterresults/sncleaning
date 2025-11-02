import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PropertyStep } from './steps/PropertyStep';
import { LinensStep } from './steps/LinensStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { BookingSummary } from './BookingSummary';
import { PaymentStep } from './steps/PaymentStep';
import { Home, Brush, Calendar, User, CreditCard, Package2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

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
  needsOvenCleaning: boolean | null;
  ovenType: 'single' | 'double' | 'range' | 'convection' | '';
  cleaningProducts: 'no' | 'products' | 'equipment' | '';
  equipmentArrangement: 'oneoff' | 'ongoing' | null;
  equipmentStorageConfirmed: boolean;
  
  // Linens
  linensHandling: 'customer-handles' | 'wash-hang' | 'wash-dry' | 'order-linens' | '';
  needsIroning: boolean | null;
  ironingHours: number;
  linenPackages: Record<string, number>;
  washDryBedSizes: Record<string, number>;
  ironingBedSizes: Record<string, number>;
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
  totalHours?: number;
  hourlyRate: number;
  totalCost: number;
  
  // Admin pricing overrides
  adminDiscountAmount?: number;
  adminDiscountPercentage?: number;
  adminHourlyRateOverride?: number;
  adminTotalCostOverride?: number;
  
  // Admin/Customer specific fields
  customerId?: number;
  selectedCustomer?: any;
  addressId?: string;
  selectedAddress?: any;
  paymentMethod?: string;
}

const steps = [
  { id: 1, title: 'Property', key: 'property', icon: <Home className="w-4 h-4" /> },
  { id: 2, title: 'Linens', key: 'linens', icon: <Package2 className="w-4 h-4" /> },
  { id: 3, title: 'Schedule', key: 'schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 4, title: 'Summary', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const AirbnbBookingForm: React.FC = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
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
    needsOvenCleaning: null,
    ovenType: '',
    cleaningProducts: '',
    equipmentArrangement: null,
    equipmentStorageConfirmed: false,
    linensHandling: '',
    needsIroning: null,
    ironingHours: 0,
    linenPackages: {},
    washDryBedSizes: {},
    ironingBedSizes: {},
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
    hourlyRate: 25,
    totalCost: 0,
  });

  // Check if user is admin AND on admin route
  useEffect(() => {
    const checkAdmin = async () => {
      // Only enable admin mode if on /admin/ route
      const isAdminRoute = location.pathname.includes('/admin/');
      
      if (!isAdminRoute) {
        setIsAdminMode(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setIsAdminMode(role?.role === 'admin' && isAdminRoute);
      } else {
        setIsAdminMode(false);
      }
    };
    checkAdmin();
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
      const newData = { ...prev, ...updates };
      
      // Recalculate costs when relevant data changes
      if (updates.estimatedHours !== undefined || updates.extraHours !== undefined) {
        const estimatedHours = updates.estimatedHours ?? newData.estimatedHours ?? 0;
        const extraHours = updates.extraHours ?? newData.extraHours;
        const totalHours = estimatedHours + extraHours;
        newData.totalCost = totalHours * newData.hourlyRate;
      }
      
      return newData;
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / steps.length) * 100;

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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 text-center mb-4">
            Airbnb Cleaning Booking Form
          </h1>
          
          {/* Step Navigation - Mobile Optimized */}
          <div className="max-w-4xl mx-auto">
            {/* Compact stepper with progress */}
            <div className="flex items-center justify-center gap-1 px-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                
                return (
                  <React.Fragment key={step.id}>
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
                  </React.Fragment>
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