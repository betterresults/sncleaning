import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CarpetCleaningItemsStep } from './steps/CarpetCleaningItemsStep';
import { CarpetCleaningScheduleStep } from './steps/CarpetCleaningScheduleStep';
import { CarpetCleaningSummary } from './CarpetCleaningSummary';
import { PaymentStep } from './steps/PaymentStep';
import { Layers, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

export interface CarpetCleaningItem {
  id: string;
  name: string;
  type: 'carpet' | 'upholstery' | 'mattress';
  size?: 'small' | 'medium' | 'large';
  quantity: number;
  price: number;
}

export interface CarpetCleaningData {
  // Items
  carpetItems: CarpetCleaningItem[];
  upholsteryItems: CarpetCleaningItem[];
  mattressItems: CarpetCleaningItem[];
  
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
  totalCost: number;
  
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

const steps = [
  { id: 1, title: 'Items', key: 'items', icon: <Layers className="w-4 h-4" /> },
  { id: 2, title: 'Schedule', key: 'schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 3, title: 'Summary', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const CarpetCleaningForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  
  const [bookingData, setBookingData] = useState<CarpetCleaningData>({
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
    totalCost: 0,
  });

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
            setBookingData(prev => ({
              ...prev,
              customerId: customerId,
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

  const updateBookingData = (updates: Partial<CarpetCleaningData>) => {
    setBookingData(prev => {
      const newData = { ...prev, ...updates };
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

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CarpetCleaningItemsStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <CarpetCleaningScheduleStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
            isAdminMode={isAdminMode}
          />
        );
      case 3:
        return stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentStep
              data={{
                ...bookingData,
                propertyType: 'flat',
                bedrooms: '1',
                bathrooms: '1',
                linens: { provided: false, quantity: 0, type: '' },
                estimatedHours: null,
                hourlyRate: 0,
                calculatedCleaningCost: bookingData.totalCost,
                calculatedLinenCost: 0,
              }}
              onUpdate={(updates: any) => {
                const relevantUpdates: Partial<CarpetCleaningData> = {};
                if ('firstName' in updates) relevantUpdates.firstName = updates.firstName;
                if ('lastName' in updates) relevantUpdates.lastName = updates.lastName;
                if ('email' in updates) relevantUpdates.email = updates.email;
                if ('phone' in updates) relevantUpdates.phone = updates.phone;
                if ('houseNumber' in updates) relevantUpdates.houseNumber = updates.houseNumber;
                if ('street' in updates) relevantUpdates.street = updates.street;
                if ('postcode' in updates) relevantUpdates.postcode = updates.postcode;
                if ('city' in updates) relevantUpdates.city = updates.city;
                if ('propertyAccess' in updates) relevantUpdates.propertyAccess = updates.propertyAccess;
                if ('accessNotes' in updates) relevantUpdates.accessNotes = updates.accessNotes;
                updateBookingData(relevantUpdates);
              }}
              onBack={prevStep}
              isAdminMode={isAdminMode}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Carpet & Upholstery Cleaning
          </h1>
          <p className="text-muted-foreground">
            Professional steam cleaning for carpets, upholstery, and mattresses
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2 bg-white rounded-full p-2 shadow-sm border border-border">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => isCompleted && goToStep(step.id)}
                    disabled={!isCompleted && !isActive}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.icon}
                    <span className="hidden sm:inline font-medium">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white border border-border">
              {renderStep()}
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <CarpetCleaningSummary
              data={bookingData}
              isAdminMode={isAdminMode}
              onUpdate={updateBookingData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarpetCleaningForm;
