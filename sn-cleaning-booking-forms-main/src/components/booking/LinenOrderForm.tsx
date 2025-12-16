import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package2, ShoppingCart, Calendar, Clock, Info, Minus, Plus, BedDouble, BedSingle, Bath, Shirt, UtensilsCrossed, CalendarCheck, ArrowRight } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLinenProducts } from '@/hooks/useLinenProducts';
import { PaymentStep } from './steps/PaymentStep';
import { LinenOrderSummary } from '@/components/booking/summaries/LinenOrderSummary';
import { cn } from '@/lib/utils';
export interface LinenOrderData {
  linenPackages: Record<string, number>;
  deliveryTiming: 'next-3-days' | 'next-7-days' | 'flexible' | '';
  deliveryNotes: string;

  // Fields required by PaymentStep
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Address fields for PaymentStep
  addressId?: string;
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  totalCost: number;
  customerId?: number;
  paymentMethod?: string;
}

// Better icon mapping for linen types
const getLinenIcon = (productName: string, type?: string) => {
  const name = productName.toLowerCase();
  if (name.includes('single') || name.includes('bed')) return BedSingle;
  if (name.includes('double') || name.includes('king')) return BedDouble;
  if (name.includes('bath') || name.includes('towel')) return Bath;
  if (name.includes('robe')) return Shirt;
  if (name.includes('tea')) return UtensilsCrossed;
  return Package2;
};
const LinenOrderForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const {
    products: linenProductsFromDB = []
  } = useLinenProducts();
  const [orderData, setOrderData] = useState<LinenOrderData>({
    linenPackages: {},
    deliveryTiming: '',
    deliveryNotes: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    houseNumber: '',
    street: '',
    postcode: '',
    city: '',
    totalCost: 0
  });

  // Check if user is admin AND on admin route, and load customer ID for logged-in customers
  useEffect(() => {
    const checkAdminAndLoadCustomer = async () => {
      const isAdminRoute = location.pathname.includes('/admin/');
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session?.user) {
        const {
          data: role
        } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
        const isAdminOrSalesAgent = role?.role === 'admin' || role?.role === 'sales_agent';
        setIsAdminMode(isAdminOrSalesAgent && isAdminRoute);
        if (!isAdminRoute) {
          const {
            data: profile
          } = await supabase.from('profiles').select('customer_id').eq('user_id', session.user.id).single();
          let customerId = profile?.customer_id;
          if (!customerId) {
            const {
              data: customer
            } = await supabase.from('customers').select('id, first_name, last_name, email').eq('email', session.user.email).single();
            customerId = customer?.id;
            if (customerId) {
              await supabase.from('profiles').update({
                customer_id: customerId
              }).eq('user_id', session.user.id);

              // Pre-fill customer details
              setOrderData(prev => ({
                ...prev,
                customerId,
                firstName: customer.first_name || '',
                lastName: customer.last_name || '',
                email: customer.email || '',
                phone: ''
              }));
            }
          } else {
            // Fetch customer details
            const {
              data: customer
            } = await supabase.from('customers').select('first_name, last_name, email').eq('id', customerId).single();
            if (customer) {
              setOrderData(prev => ({
                ...prev,
                customerId,
                firstName: customer.first_name || '',
                lastName: customer.last_name || '',
                email: customer.email || '',
                phone: ''
              }));
            }
          }
        }
      }
    };
    checkAdminAndLoadCustomer();
  }, [location.pathname]);

  // Load Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('stripe-get-publishable-key');
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

  // Use dynamic linen products or fallback
  const linenPackages = linenProductsFromDB.length > 0 ? linenProductsFromDB.map((product: any) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    includes: product.items_included ? product.items_included.split(',').map((i: string) => i.trim()) : [],
    description: product.description || product.name,
    type: product.type
  })) : [{
    id: 'single',
    name: 'Single Bed Set',
    price: 19.95,
    type: 'bed_linen',
    includes: ['Duvet Cover', 'Fitted Sheet', '2 Pillowcases', 'Bath Towel', 'Hand Towel']
  }, {
    id: 'double',
    name: 'Double Bed Set',
    price: 23.95,
    type: 'bed_linen',
    includes: ['Duvet Cover', 'Fitted Sheet', '4 Pillowcases', '2 Bath Towels', '2 Hand Towels']
  }, {
    id: 'king',
    name: 'King Bed Set',
    price: 25.75,
    type: 'bed_linen',
    includes: ['Duvet Cover', 'Fitted Sheet', '4 Pillowcases', '2 Bath Towels', '2 Hand Towels']
  }, {
    id: 'superking',
    name: 'Super King Bed Set',
    price: 26.75,
    type: 'bed_linen',
    includes: ['Duvet Cover', 'Fitted Sheet', '4 Pillowcases', '2 Bath Towels', '2 Hand Towels']
  }, {
    id: 'bathmat',
    name: 'Bath Mat',
    price: 2.80,
    type: 'bath_linen',
    includes: ['1 Bath Mat']
  }, {
    id: 'bathsheet',
    name: 'Bath Sheet',
    price: 3.10,
    type: 'bath_linen',
    includes: ['1 Bath Sheet']
  }, {
    id: 'bathrobe',
    name: 'Bath Robe',
    price: 6.50,
    type: 'accessories',
    includes: ['1 Bath Robe']
  }, {
    id: 'teatowel',
    name: 'Tea Towel',
    price: 1.30,
    type: 'accessories',
    includes: ['1 Tea Towel']
  }];
  const updatePackageQuantity = (packageId: string, quantity: number) => {
    const currentPackages = orderData.linenPackages || {};
    const updatedPackages = {
      ...currentPackages,
      [packageId]: Math.max(0, quantity)
    };

    // Calculate total
    const total = Object.entries(updatedPackages).reduce((sum, [id, qty]) => {
      const pkg = linenPackages.find(p => p.id === id);
      return sum + (pkg ? pkg.price * qty : 0);
    }, 0);
    setOrderData(prev => ({
      ...prev,
      linenPackages: updatedPackages,
      totalCost: total
    }));
  };
  const linenTotal = orderData.totalCost;
  const hasReachedMinimum = linenTotal >= 150;
  const canContinueToPayment = hasReachedMinimum && orderData.deliveryTiming;
  const updateOrderData = (updates: Partial<LinenOrderData>) => {
    setOrderData(prev => ({
      ...prev,
      ...updates
    }));
  };
  const nextStep = () => {
    if (currentStep === 1 && canContinueToPayment) {
      setCurrentStep(2);
    }
  };
  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };
  return <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white py-4 mb-3 border-b border-border shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between mb-4">
            {!isAdminMode && orderData.customerId && (
              <Button
                variant="outline"
                onClick={() => navigate('/customer-dashboard')}
                className="text-sm font-medium hover:bg-accent/50 transition-all duration-200 shadow-sm"
              >
                ← Back to Dashboard
              </Button>
            )}
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 ${!isAdminMode && orderData.customerId ? '' : 'mx-auto'}`}>
              Linen Order Form
            </h1>
            {!isAdminMode && orderData.customerId && <div className="w-[140px]" />}
          </div>
          
          {/* Step Navigation - Mobile Optimized */}
          <div className="max-w-4xl mx-auto">
            {/* Compact stepper with progress */}
            <div className="flex items-center justify-center gap-1 px-2">
              {[
                { id: 1, title: 'Selection' },
                { id: 2, title: 'Summary' }
              ].map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                
                return (
                  <div key={step.id} className="contents">
                    <button
                      onClick={() => (isCompleted || stepNumber <= currentStep) && setCurrentStep(stepNumber as 1 | 2)}
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
                    
                    {index < 1 && (
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
        {currentStep === 1 ?
      // Step 1: Linen Selection
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Form - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Linen Packages Section */}
            <Card className="p-4 sm:p-6 lg:p-8 bg-white transition-shadow duration-300 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-3 mb-6">
                <Package2 className="h-7 w-7 text-[#18A5A5]" />
                <h2 className="text-2xl font-bold text-[#185166]">Select Linen Packages</h2>
              </div>

              {/* Info Banner */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> £150 minimum order required. Delivery date will be confirmed based on your address and our availability.
                  </div>
                </div>
              </div>

              {/* Linen Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {linenPackages.map(pkg => {
                const quantity = orderData.linenPackages[pkg.id] || 0;
                const isSelected = quantity > 0;
                const IconComponent = getLinenIcon(pkg.name, pkg.type);
                return <Card key={pkg.id} className={`relative overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-[#18A5A5] shadow-lg' : 'hover:shadow-md'}`}>
                      <div className="p-4 space-y-3">
                        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isSelected ? 'bg-[#18A5A5]/10' : 'bg-gray-100'}`}>
                          <IconComponent className={`h-6 w-6 ${isSelected ? 'text-[#18A5A5]' : 'text-gray-600'}`} />
                        </div>
                        
                        <div className="text-center">
                          <h3 className="font-semibold text-sm text-[#185166]">{pkg.name}</h3>
                          <p className="text-lg font-bold text-[#18A5A5] mt-1">£{pkg.price.toFixed(2)}</p>
                        </div>

                        {/* Always show quantity controls */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updatePackageQuantity(pkg.id, quantity - 1)} disabled={quantity === 0}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-bold text-[#185166] min-w-[2rem] text-center">
                            {quantity}
                          </span>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updatePackageQuantity(pkg.id, quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Info tooltip */}
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 mx-auto cursor-help" />
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            {pkg.includes.map((item, idx) => <div key={idx}>• {item}</div>)}
                          </div>
                        </div>
                      </div>
                    </Card>;
              })}
              </div>
            </Card>

            {/* Delivery Preferences */}
            <Card className="p-4 sm:p-6 lg:p-8 bg-white transition-shadow duration-300 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-7 w-7 text-[#18A5A5]" />
                <h2 className="text-2xl font-bold text-[#185166]">Delivery Preferences</h2>
              </div>

              <div className="space-y-6">
                {/* Info Text */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📦 Delivery date will be confirmed based on your address and our availability. We'll contact you within 24 hours to arrange the delivery.
                  </p>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Delivery Preferences <span className="text-red-500">*</span>
                  </Label>
                  
                  {/* 3 Cards on one row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card onClick={() => updateOrderData({
                    deliveryTiming: 'next-3-days'
                  })} className={cn("cursor-pointer transition-all hover:shadow-lg", orderData.deliveryTiming === 'next-3-days' && "ring-2 ring-[#18A5A5] shadow-lg")}>
                      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <Clock className={cn("h-8 w-8", orderData.deliveryTiming === 'next-3-days' ? "text-[#18A5A5]" : "text-gray-600")} />
                        <h3 className={cn("font-semibold", orderData.deliveryTiming === 'next-3-days' ? "text-[#18A5A5]" : "text-[#185166]")}>Next 3 days</h3>
                      </CardContent>
                    </Card>
                    
                    <Card onClick={() => updateOrderData({
                    deliveryTiming: 'next-7-days'
                  })} className={cn("cursor-pointer transition-all hover:shadow-lg", orderData.deliveryTiming === 'next-7-days' && "ring-2 ring-[#18A5A5] shadow-lg")}>
                      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <Calendar className={cn("h-8 w-8", orderData.deliveryTiming === 'next-7-days' ? "text-[#18A5A5]" : "text-gray-600")} />
                        <h3 className={cn("font-semibold", orderData.deliveryTiming === 'next-7-days' ? "text-[#18A5A5]" : "text-[#185166]")}>Next 7 days</h3>
                      </CardContent>
                    </Card>
                    
                    <Card onClick={() => updateOrderData({
                    deliveryTiming: 'flexible'
                  })} className={cn("cursor-pointer transition-all hover:shadow-lg", orderData.deliveryTiming === 'flexible' && "ring-2 ring-[#18A5A5] shadow-lg")}>
                      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <CalendarCheck className={cn("h-8 w-8", orderData.deliveryTiming === 'flexible' ? "text-[#18A5A5]" : "text-gray-600")} />
                        <h3 className={cn("font-semibold", orderData.deliveryTiming === 'flexible' ? "text-[#18A5A5]" : "text-[#185166]")}>Completely flexible</h3>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryNotes" className="text-base font-semibold mb-2 block">
                    Additional delivery details or special instructions
                  </Label>
                  <Textarea id="deliveryNotes" placeholder="e.g., Prefer morning delivery, gate code, access instructions, etc." value={orderData.deliveryNotes} onChange={e => updateOrderData({
                  deliveryNotes: e.target.value
                })} rows={4} className="resize-none" />
                </div>
              </div>
            </Card>

            {/* Continue Button - in main form area */}
            <div className="mt-6">
              <Button onClick={nextStep} disabled={!canContinueToPayment} className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white py-6 text-lg font-semibold">
                Continue to Payment
              </Button>
              {!orderData.deliveryTiming && linenTotal > 0 && <p className="text-xs text-center text-gray-500 mt-2">
                  Please select delivery timing to continue
                </p>}
              {!hasReachedMinimum && orderData.deliveryTiming && <p className="text-xs text-center text-gray-500 mt-2">
                  £150 minimum order required
                </p>}
            </div>
          </div>

          {/* Order Summary - Takes 1 column */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6 bg-white sticky top-4 transition-shadow duration-300 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="h-6 w-6 text-[#18A5A5]" />
                <h2 className="text-xl font-bold text-[#185166]">Order Summary</h2>
              </div>

              {Object.keys(orderData.linenPackages).length === 0 ? <div className="text-center py-8 text-gray-500">
                  <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Select linen packages to see your order summary</p>
                </div> : <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 pb-4 border-b">
                    {Object.entries(orderData.linenPackages).filter(([_, qty]) => qty > 0).map(([pkgId, quantity]) => {
                  const pkg = linenPackages.find(p => p.id === pkgId);
                  if (!pkg) return null;
                  const IconComponent = getLinenIcon(pkg.name, pkg.type);
                  return <div key={pkgId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1">
                              <IconComponent className="h-4 w-4 text-[#18A5A5]" />
                              <span className="text-gray-700">{pkg.name}</span>
                              <span className="text-gray-500">x{quantity}</span>
                            </div>
                            <span className="font-semibold text-[#185166]">
                              £{(pkg.price * quantity).toFixed(2)}
                            </span>
                          </div>;
                })}
                  </div>

                  {/* Total */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-[#185166]">Order Total:</span>
                      <span className="text-[#18A5A5]">£{linenTotal.toFixed(2)}</span>
                    </div>

                    {!hasReachedMinimum && linenTotal > 0 && <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 text-center">
                          <strong>Need £{(150 - linenTotal).toFixed(2)} more</strong> to reach £150 minimum
                        </p>
                      </div>}

                    {hasReachedMinimum && <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
                        ✓ Minimum order met
                      </Badge>}
                  </div>
                </div>}
            </Card>
          </div>
        </div> :
      // Step 2: Payment Step - Same 2-column layout as Airbnb/Domestic
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Payment Form - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6 lg:p-8 bg-white transition-shadow duration-300 border border-border shadow-[0_20px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)]">
            <Elements stripe={stripePromise}>
              <PaymentStep data={orderData as any} onUpdate={updateOrderData} onBack={prevStep} isAdminMode={isAdminMode} formType="linen" />
            </Elements>
          </Card>
        </div>
        
        {/* Order Summary - Takes 1 column, always visible */}
        <div className="lg:col-span-1">
          <LinenOrderSummary data={orderData} linenProducts={linenPackages} />
        </div>
      </div>}
      </main>
    </div>;
};
export default LinenOrderForm;