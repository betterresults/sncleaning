import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LinensStep } from './steps/LinensStep';
import { BookingSummary } from './BookingSummary';
import { PaymentStep } from './steps/PaymentStep';
import { Package2, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export interface LinenOrderData {
  // Linens
  linensHandling: 'customer-handles' | 'wash-hang' | 'wash-dry' | 'order-linens' | '';
  needsIroning: boolean | null;
  ironingHours: number;
  linenPackages: Record<string, number>;
  bedSizes: Record<string, number>;
  extraHours: number;
  
  // Contact (for non-logged in users)
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
  
  // Schedule
  selectedDate: Date | null;
  selectedTime: string;
  notes: string;
  additionalDetails: string;
  
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
  
  // Admin/Customer specific fields
  customerId?: number;
  selectedCustomer?: any;
  addressId?: string;
  selectedAddress?: any;
  paymentMethod?: string;
}

const steps = [
  { id: 1, title: 'Linens', key: 'linens', icon: <Package2 className="w-4 h-4" /> },
  { id: 2, title: 'Payment', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const LinenOrderForm: React.FC = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [bookingData, setBookingData] = useState<LinenOrderData>({
    linensHandling: '',
    needsIroning: null,
    ironingHours: 0,
    linenPackages: {},
    bedSizes: {},
    extraHours: 0,
    selectedDate: null,
    selectedTime: '',
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
    estimatedHours: 0,
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
        
        const isAdmin = role?.role === 'admin';
        setIsAdminMode(isAdmin && isAdminRoute);
        
        // If not on admin route (customer booking), always load customer profile
        if (!isAdminRoute) {
          // First try to get customer from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('customer_id')
            .eq('user_id', session.user.id)
            .single();
          
          let customerId = profile?.customer_id;
          
          // If no customer_id in profile, try to find customer by email
          if (!customerId) {
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('email', session.user.email)
              .single();
            
            customerId = customer?.id;
            
            // Update profile with customer_id if found
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

  const updateBookingData = (updates: Partial<LinenOrderData>) => {
    setBookingData(prev => {
      const newData = { ...prev, ...updates };
      
      // Recalculate costs when relevant data changes
      if ('estimatedAdditionalHours' in updates || 'extraHours' in updates) {
        const estimatedHours = 0; // Linen orders don't have base hours
        const additionalHours = newData.estimatedAdditionalHours ?? 0;
        const extraHours = newData.extraHours ?? 0;
        const totalHours = estimatedHours + additionalHours + extraHours;
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
          <LinensStep
            data={bookingData as any}
            onUpdate={updateBookingData as any}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
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
      <header className="bg-white py-4 mb-3 border-b border-border shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
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
              Linen Order Form
            </h1>
            {!isAdminMode && bookingData.customerId && <div className="w-[140px]" />}
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
              data={bookingData as any} 
              isAdminMode={isAdminMode}
              onUpdate={updateBookingData as any}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LinenOrderForm;
