import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X, AlertCircle, MapPin, Calendar, Package, FileText, Clock, CheckCircle } from 'lucide-react';
import { useLinenProducts } from '@/hooks/useLinenProducts';
import { useCustomerLinenOrders } from '@/hooks/useCustomerLinenOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateLinenOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productType: string;
}

type ScheduleOption = 'flexible' | 'delivery' | 'pickup';

export const CreateLinenOrderDialog: React.FC<CreateLinenOrderDialogProps> = ({
  open,
  onOpenChange,
  onOrderCreated,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('flexible');
  const [requestedDate, setRequestedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { products } = useLinenProducts();
  const { createOrder } = useCustomerLinenOrders();

  // Get customer profile and addresses
  const { data: profile } = useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  const { data: addresses } = useQuery({
    queryKey: ['customer-addresses', profile?.customer_id],
    queryFn: async () => {
      if (!profile?.customer_id) return [];
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('is_default', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.customer_id
  });

  const addProduct = () => {
    if (!selectedProduct) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // Check if product already added
    if (orderItems.some(item => item.productId === selectedProduct)) return;

    const newItem: OrderItem = {
      productId: selectedProduct,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      subtotal: product.price,
      productType: product.type
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setOrderItems(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity, subtotal: item.unitPrice * quantity }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setOrderItems(items => items.filter(item => item.productId !== productId));
  };

  const totalCost = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const meetsMinimum = totalCost >= 150;
  
  // Organize products: sets first (Bath sets, etc.), then individuals
  const organizedProducts = [...products].sort((a, b) => {
    const aIsSet = a.name.toLowerCase().includes('set') || a.type.toLowerCase().includes('set');
    const bIsSet = b.name.toLowerCase().includes('set') || b.type.toLowerCase().includes('set');
    
    // Sets first
    if (aIsSet && !bIsSet) return -1;
    if (!aIsSet && bIsSet) return 1;
    
    // Within sets, prioritize bath sets
    if (aIsSet && bIsSet) {
      const aIsBath = a.name.toLowerCase().includes('bath');
      const bIsBath = b.name.toLowerCase().includes('bath');
      if (aIsBath && !bIsBath) return -1;
      if (!aIsBath && bIsBath) return 1;
    }
    
    return a.name.localeCompare(b.name);
  });
  
  const availableProducts = organizedProducts.filter(p => !orderItems.some(item => item.productId === p.id));

  const formatProductName = (product: any) => {
    const isSet = product.name.toLowerCase().includes('set') || product.type.toLowerCase().includes('set');
    if (isSet && !product.name.toLowerCase().startsWith('set ')) {
      return `Set ${product.name}`;
    }
    return product.name;
  };

  const handleSubmit = async () => {
    if (!selectedAddress || orderItems.length === 0 || !meetsMinimum) return;

    setLoading(true);
    try {
      const orderData: any = {
        addressId: selectedAddress,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        notes: notes || undefined
      };

      // Add date information based on schedule option
      if (scheduleOption === 'delivery' && requestedDate) {
        orderData.deliveryDate = requestedDate;
        orderData.notes = (orderData.notes || '') + '\n\nRequested delivery date - please confirm availability.';
      } else if (scheduleOption === 'pickup' && requestedDate) {
        orderData.pickupDate = requestedDate;
        orderData.notes = (orderData.notes || '') + '\n\nRequested pickup date - please confirm availability.';
      }

      const success = await createOrder(orderData);

      if (success) {
        // Reset form
        setSelectedAddress('');
        setScheduleOption('flexible');
        setRequestedDate('');
        setNotes('');
        setOrderItems([]);
        onOrderCreated();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAddress('');
    setScheduleOption('flexible');
    setRequestedDate('');
    setNotes('');
    setOrderItems([]);
    setSelectedProduct('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#185166]">Create New Linen Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Address Selection Card */}
          <div className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-white hover:shadow-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#18A5A5]/10 rounded-lg">
                <MapPin className="h-5 w-5 text-[#18A5A5]" />
              </div>
              <h3 className="text-lg font-bold text-[#185166]">Delivery Address</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-[#185166]">Select delivery address *</Label>
              <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-[#18A5A5] focus:border-[#18A5A5] rounded-lg">
                  <SelectValue placeholder="Choose your delivery address..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                  {addresses?.map((address) => (
                    <SelectItem key={address.id} value={address.id} className="hover:bg-[#18A5A5]/10">
                      <div className="flex flex-col">
                        <span className="font-medium">{address.address}</span>
                        <span className="text-sm text-gray-500">{address.postcode}{address.is_default && ' (Default)'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule & Timing Card */}
          <div className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-white hover:shadow-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#18A5A5]/10 rounded-lg">
                <Calendar className="h-5 w-5 text-[#18A5A5]" />
              </div>
              <h3 className="text-lg font-bold text-[#185166]">Schedule & Timing</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[#185166]">Scheduling Preference</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      scheduleOption === 'flexible' 
                        ? 'border-[#18A5A5] bg-[#18A5A5]/5' 
                        : 'border-gray-200 hover:border-[#18A5A5]/50'
                    }`}
                    onClick={() => setScheduleOption('flexible')}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${scheduleOption === 'flexible' ? 'text-[#18A5A5]' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium text-[#185166]">Flexible</div>
                        <div className="text-sm text-gray-500">We'll contact you to arrange</div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      scheduleOption === 'delivery' 
                        ? 'border-[#18A5A5] bg-[#18A5A5]/5' 
                        : 'border-gray-200 hover:border-[#18A5A5]/50'
                    }`}
                    onClick={() => setScheduleOption('delivery')}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${scheduleOption === 'delivery' ? 'text-[#18A5A5]' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium text-[#185166]">Request Delivery</div>
                        <div className="text-sm text-gray-500">Suggest a delivery date</div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      scheduleOption === 'pickup' 
                        ? 'border-[#18A5A5] bg-[#18A5A5]/5' 
                        : 'border-gray-200 hover:border-[#18A5A5]/50'
                    }`}
                    onClick={() => setScheduleOption('pickup')}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${scheduleOption === 'pickup' ? 'text-[#18A5A5]' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium text-[#185166]">Request Pickup</div>
                        <div className="text-sm text-gray-500">Suggest a pickup date</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {(scheduleOption === 'delivery' || scheduleOption === 'pickup') && (
                <div className="space-y-3">
                  <Label htmlFor="requestedDate" className="text-sm font-medium text-[#185166]">
                    Requested {scheduleOption === 'delivery' ? 'Delivery' : 'Pickup'} Date
                  </Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="h-12 border-2 border-gray-200 hover:border-[#18A5A5] focus:border-[#18A5A5] rounded-lg"
                  />
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <strong>Please note:</strong> This is a request only. We'll contact you to confirm availability and arrange the exact timing.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Selection Card */}
          <div className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-white hover:shadow-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#18A5A5]/10 rounded-lg">
                <Package className="h-5 w-5 text-[#18A5A5]" />
              </div>
              <h3 className="text-lg font-bold text-[#185166]">Select Linen Items</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1 h-12 border-2 border-gray-200 hover:border-[#18A5A5] focus:border-[#18A5A5] rounded-lg">
                    <SelectValue placeholder="Choose linen items..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64">
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="hover:bg-[#18A5A5]/10">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">{formatProductName(product)}</span>
                          <span className="text-[#18A5A5] font-bold ml-4">£{product.price.toFixed(2)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addProduct} 
                  disabled={!selectedProduct}
                  className="h-12 px-6 bg-[#18A5A5] hover:bg-[#185166] text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-[#185166]">{formatProductName(item)}</div>
                      <div className="text-sm text-gray-500">Type: {item.productType}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-8 w-8 p-0 border-gray-300 hover:border-[#18A5A5]"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center border-gray-300 focus:border-[#18A5A5]"
                      />
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-8 w-8 p-0 border-gray-300 hover:border-[#18A5A5]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-lg font-bold text-[#18A5A5] w-20 text-right">
                      £{item.subtotal.toFixed(2)}
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(item.productId)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No items selected</p>
                  <p className="text-sm">Choose linen items from the dropdown above</p>
                </div>
              )}

              {/* Total and Minimum Check */}
              {orderItems.length > 0 && (
                <div className="pt-4 border-t-2 border-gray-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-[#185166]">Order Total:</span>
                    <span className="text-2xl font-bold text-[#18A5A5]">£{totalCost.toFixed(2)}</span>
                  </div>
                  
                  {!meetsMinimum && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800">
                        <strong>Minimum Order Required:</strong> We have a minimum charge of £150 for linen orders. 
                        Add £{(150 - totalCost).toFixed(2)} more to meet this requirement.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          <div className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-white hover:shadow-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#18A5A5]/10 rounded-lg">
                <FileText className="h-5 w-5 text-[#18A5A5]" />
              </div>
              <h3 className="text-lg font-bold text-[#185166]">Order Notes</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-[#185166]">Special instructions (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions, access details, or preferences for this order..."
                rows={4}
                className="border-2 border-gray-200 hover:border-[#18A5A5] focus:border-[#18A5A5] rounded-lg"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-6 py-3 border-2 border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedAddress || orderItems.length === 0 || !meetsMinimum || loading}
              className="px-8 py-3 bg-[#18A5A5] hover:bg-[#185166] text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Creating Order...
                </div>
              ) : (
                `Create Order - £${totalCost.toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};