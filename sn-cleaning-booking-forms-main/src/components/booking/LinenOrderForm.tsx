import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  Package2, ShoppingCart, Calendar, Clock, Info, Minus, Plus,
  BedDouble, BedSingle, Bath, Shirt, UtensilsCrossed
} from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLinenProducts } from '@/hooks/useLinenProducts';

export interface LinenOrderData {
  linenPackages: Record<string, number>;
  deliveryTiming: 'next-3-days' | 'next-7-days' | 'flexible' | '';
  deliveryNotes: string;
  
  // Contact (for payment)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  
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
  const { toast } = useToast();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { products: linenProductsFromDB = [] } = useLinenProducts();
  
  const [orderData, setOrderData] = useState<LinenOrderData>({
    linenPackages: {},
    deliveryTiming: '',
    deliveryNotes: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    totalCost: 0,
  });

  // Check if user is admin AND on admin route, and load customer ID for logged-in customers
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
              .select('id, first_name, last_name, email')
              .eq('email', session.user.email)
              .single();
            
            customerId = customer?.id;
            
            if (customerId) {
              await supabase
                .from('profiles')
                .update({ customer_id: customerId })
                .eq('user_id', session.user.id);
              
              // Pre-fill customer details
              setOrderData(prev => ({
                ...prev,
                customerId,
                firstName: customer.first_name || '',
                lastName: customer.last_name || '',
                email: customer.email || '',
                phone: '',
              }));
            }
          } else {
            // Fetch customer details
            const { data: customer } = await supabase
              .from('customers')
              .select('first_name, last_name, email')
              .eq('id', customerId)
              .single();
            
            if (customer) {
              setOrderData(prev => ({
                ...prev,
                customerId,
                firstName: customer.first_name || '',
                lastName: customer.last_name || '',
                email: customer.email || '',
                phone: '',
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

  // Use dynamic linen products or fallback
  const linenPackages = linenProductsFromDB.length > 0
    ? linenProductsFromDB.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        includes: product.items_included ? product.items_included.split(',').map((i: string) => i.trim()) : [],
        description: product.description || product.name,
        type: product.type,
      }))
    : [
        { id: 'single', name: 'Single Bed Set', price: 19.95, type: 'bed_linen', includes: ['Duvet Cover', 'Fitted Sheet', '2 Pillowcases', 'Bath Towel', 'Hand Towel'] },
        { id: 'double', name: 'Double Bed Set', price: 23.95, type: 'bed_linen', includes: ['Duvet Cover', 'Fitted Sheet', '4 Pillowcases', '2 Bath Towels', '2 Hand Towels'] },
        { id: 'king', name: 'King Bed Set', price: 25.75, type: 'bed_linen', includes: ['Duvet Cover', 'Fitted Sheet', '4 Pillowcases', '2 Bath Towels', '2 Hand Towels'] },
        { id: 'superking', name: 'Super King Bed Set', price: 26.75, type: 'bed_linen', includes: ['Duvet Cover', 'Fitted Sheet', '4 Pillowcases', '2 Bath Towels', '2 Hand Towels'] },
        { id: 'bathmat', name: 'Bath Mat', price: 2.80, type: 'bath_linen', includes: ['1 Bath Mat'] },
        { id: 'bathsheet', name: 'Bath Sheet', price: 3.10, type: 'bath_linen', includes: ['1 Bath Sheet'] },
        { id: 'bathrobe', name: 'Bath Robe', price: 6.50, type: 'accessories', includes: ['1 Bath Robe'] },
        { id: 'teatowel', name: 'Tea Towel', price: 1.30, type: 'accessories', includes: ['1 Tea Towel'] }
      ];

  const updatePackageQuantity = (packageId: string, quantity: number) => {
    const currentPackages = orderData.linenPackages || {};
    const updatedPackages = { ...currentPackages, [packageId]: Math.max(0, quantity) };
    
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
  const canSubmit = hasReachedMinimum && orderData.deliveryTiming && orderData.email;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      // Here you would submit the order
      toast({
        title: "Order Placed!",
        description: "Your linen order has been submitted successfully.",
      });
      
      // Navigate to confirmation or dashboard
      navigate('/customer-dashboard');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white py-6 border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            {!isAdminMode && orderData.customerId && (
              <Button
                variant="outline"
                onClick={() => navigate('/customer-dashboard')}
                className="text-sm"
              >
                ← Back to Dashboard
              </Button>
            )}
            <h1 className={`text-3xl md:text-4xl font-bold text-[#185166] ${!isAdminMode && orderData.customerId ? '' : 'mx-auto'}`}>
              🧺 Order Linen Packages
            </h1>
            {!isAdminMode && orderData.customerId && <div className="w-[160px]" />}
          </div>
          <p className="text-center text-gray-600 mt-2">Fresh, quality linens delivered to your property</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Linen Packages Section */}
            <Card className="p-6 bg-white shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Package2 className="h-7 w-7 text-[#18A5A5]" />
                <h2 className="text-2xl font-bold text-[#185166]">Select Linen Packages</h2>
              </div>

              {/* Info Banners */}
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <strong>Delivery Confirmation Required:</strong> Linen delivery timing will be confirmed with you after your order. We'll arrange the best delivery time based on your preferences below.
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm text-amber-800">
                    <strong>Important:</strong> £150 minimum order for linen delivery. Depending on your booking frequency, we can arrange delivery every 2-4 weeks.
                  </div>
                </div>
              </div>

              {/* Linen Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {linenPackages.map((pkg) => {
                  const quantity = orderData.linenPackages[pkg.id] || 0;
                  const isSelected = quantity > 0;
                  const IconComponent = getLinenIcon(pkg.name, pkg.type);
                  
                  return (
                    <Card
                      key={pkg.id}
                      className={`relative overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? 'ring-2 ring-[#18A5A5] shadow-lg'
                          : 'hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <div className="p-4 space-y-3">
                        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-[#18A5A5]/10' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${isSelected ? 'text-[#18A5A5]' : 'text-gray-600'}`} />
                        </div>
                        
                        <div className="text-center">
                          <h3 className="font-semibold text-sm text-[#185166]">{pkg.name}</h3>
                          <p className="text-lg font-bold text-[#18A5A5] mt-1">£{pkg.price.toFixed(2)}</p>
                        </div>

                        {isSelected ? (
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updatePackageQuantity(pkg.id, quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-bold text-[#185166] min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updatePackageQuantity(pkg.id, quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => updatePackageQuantity(pkg.id, 1)}
                          >
                            Add
                          </Button>
                        )}

                        {/* Info tooltip */}
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 mx-auto cursor-help" />
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            {pkg.includes.map((item, idx) => (
                              <div key={idx}>• {item}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>

            {/* Delivery Preferences */}
            <Card className="p-6 bg-white shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-7 w-7 text-[#18A5A5]" />
                <h2 className="text-2xl font-bold text-[#185166]">Delivery Preferences</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    When would you like delivery? <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={orderData.deliveryTiming}
                    onValueChange={(value: any) => setOrderData(prev => ({ ...prev, deliveryTiming: value }))}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="next-3-days" id="next-3-days" />
                        <Label htmlFor="next-3-days" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#18A5A5]" />
                            <span className="font-medium">Next 3 days</span>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="next-7-days" id="next-7-days" />
                        <Label htmlFor="next-7-days" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#18A5A5]" />
                            <span className="font-medium">Next 7 days</span>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="flexible" id="flexible" />
                        <Label htmlFor="flexible" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#18A5A5]" />
                            <span className="font-medium">I am completely flexible</span>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="deliveryNotes" className="text-base font-semibold mb-2 block">
                    Additional delivery details or special instructions
                  </Label>
                  <Textarea
                    id="deliveryNotes"
                    placeholder="e.g., Prefer morning delivery, leave with neighbor if not home, gate code, etc."
                    value={orderData.deliveryNotes}
                    onChange={(e) => setOrderData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-base font-semibold mb-2 block">
                    Delivery Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Full delivery address"
                    value={orderData.address}
                    onChange={(e) => setOrderData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary - Takes 1 column */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-lg sticky top-4">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="h-6 w-6 text-[#18A5A5]" />
                <h2 className="text-xl font-bold text-[#185166]">Order Summary</h2>
              </div>

              {Object.keys(orderData.linenPackages).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Select linen packages to see your order summary</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 pb-4 border-b">
                    {Object.entries(orderData.linenPackages)
                      .filter(([_, qty]) => qty > 0)
                      .map(([pkgId, quantity]) => {
                        const pkg = linenPackages.find(p => p.id === pkgId);
                        if (!pkg) return null;
                        const IconComponent = getLinenIcon(pkg.name, pkg.type);
                        
                        return (
                          <div key={pkgId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1">
                              <IconComponent className="h-4 w-4 text-[#18A5A5]" />
                              <span className="text-gray-700">{pkg.name}</span>
                              <span className="text-gray-500">x{quantity}</span>
                            </div>
                            <span className="font-semibold text-[#185166]">
                              £{(pkg.price * quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Total */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-[#185166]">Order Total:</span>
                      <span className="text-[#18A5A5]">£{linenTotal.toFixed(2)}</span>
                    </div>

                    {!hasReachedMinimum && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 text-center">
                          <strong>Need £{(150 - linenTotal).toFixed(2)} more</strong> to reach minimum
                        </p>
                        <p className="text-xs text-red-600 text-center mt-1">
                          £150 minimum required
                        </p>
                      </div>
                    )}

                    {hasReachedMinimum && (
                      <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
                        ✓ Minimum order met
                      </Badge>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white py-6 text-lg font-semibold"
                  >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </Button>

                  {!orderData.deliveryTiming && linenTotal > 0 && (
                    <p className="text-xs text-center text-gray-500">
                      Please select delivery timing to continue
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LinenOrderForm;
