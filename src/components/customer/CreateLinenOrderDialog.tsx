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
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
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

  const toggleProductExpansion = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if product already added
    if (orderItems.some(item => item.productId === productId)) {
      // If already added, just expand it for quantity adjustment
      setExpandedProduct(productId);
      return;
    }

    const newItem: OrderItem = {
      productId: productId,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      subtotal: product.price,
      productType: product.type
    };

    setOrderItems([...orderItems, newItem]);
    setExpandedProduct(productId); // Auto-expand when added
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

  const getOrderItem = (productId: string): OrderItem | null => {
    return orderItems.find(item => item.productId === productId) || null;
  };

  const getProductQuantity = (productId: string): number => {
    const item = orderItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  const totalCost = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const meetsMinimum = totalCost >= 150;
  
  // Get products not yet added to order - but keep them all visible for quantity adjustment
  const availableProducts = products;

  // Categorize products (show all, including those in cart)
  const setsProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes('bed') && p.name.toLowerCase().includes('set') || 
    p.type.toLowerCase().includes('set')
  );

  const mattressProducts = availableProducts.filter(p => 
    !p.name.toLowerCase().includes('bed') &&
    !p.name.toLowerCase().includes('set') && 
    !p.type.toLowerCase().includes('set') &&
    (p.name.toLowerCase().includes('mattress') || 
     p.name.toLowerCase().includes('protector') ||
     p.type.toLowerCase().includes('mattress'))
  );

  const individualProducts = availableProducts.filter(p => 
    !p.name.toLowerCase().includes('bed') &&
    !p.name.toLowerCase().includes('set') && 
    !p.type.toLowerCase().includes('set') &&
    !p.name.toLowerCase().includes('mattress') && 
    !p.name.toLowerCase().includes('protector') &&
    !p.type.toLowerCase().includes('mattress')
  );

  const formatProductName = (product: any) => {
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
        setExpandedProduct(null);
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
    setExpandedProduct(null);
    setOrderItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50">
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
            
            <div className="space-y-6">
              {/* Product Categories */}
              <div className="space-y-6">
                {/* Sets Category */}
                {setsProducts.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-[#185166] mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Sets
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {setsProducts.map((product) => {
                        const orderItem = getOrderItem(product.id);
                        const isExpanded = expandedProduct === product.id;
                        const hasItems = orderItem && orderItem.quantity > 0;
                        
                        return (
                          <div key={product.id} className="space-y-2">
                            <div
                              className={`group cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                                hasItems 
                                  ? 'border-[#18A5A5] bg-[#18A5A5]/5' 
                                  : 'border-gray-200 hover:border-[#18A5A5] hover:bg-[#18A5A5]/5'
                              }`}
                              onClick={() => toggleProductExpansion(product.id)}
                            >
                              <div className="text-center space-y-2">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto transition-colors ${
                                  hasItems 
                                    ? 'bg-[#18A5A5]/20' 
                                    : 'bg-[#18A5A5]/10 group-hover:bg-[#18A5A5]/20'
                                }`}>
                                  <Package className="h-6 w-6 text-[#18A5A5]" />
                                </div>
                                <div className="font-medium text-[#185166] text-sm">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">{product.type}</div>
                                <div className="text-lg font-bold text-[#18A5A5]">
                                  £{product.price.toFixed(2)}
                                </div>
                                {hasItems && (
                                  <div className="text-sm font-medium text-[#18A5A5]">
                                    Quantity: {orderItem.quantity}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Expanded Quantity Controls */}
                            {isExpanded && (
                              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="text-sm font-medium text-[#185166] text-center">
                                  Select Quantity
                                </div>
                                
                                <div className="flex items-center justify-center gap-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (hasItems) {
                                        updateQuantity(product.id, Math.max(0, orderItem.quantity - 1));
                                      }
                                    }}
                                    disabled={!hasItems || orderItem.quantity <= 0}
                                    className="h-8 w-8 p-0 border-gray-300 hover:border-[#18A5A5]"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  
                                  <div className="w-16 text-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={getProductQuantity(product.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const quantity = parseInt(e.target.value) || 0;
                                        if (quantity > 0) {
                                          if (!hasItems) {
                                            addProduct(product.id);
                                          }
                                          updateQuantity(product.id, quantity);
                                        } else if (hasItems) {
                                          removeItem(product.id);
                                        }
                                      }}
                                      className="w-full h-8 text-center border-gray-300 focus:border-[#18A5A5]"
                                    />
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!hasItems) {
                                        addProduct(product.id);
                                      } else {
                                        updateQuantity(product.id, orderItem.quantity + 1);
                                      }
                                    }}
                                    className="h-8 w-8 p-0 border-gray-300 hover:border-[#18A5A5]"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {hasItems && (
                                  <div className="text-center space-y-2">
                                    <div className="text-sm font-bold text-[#18A5A5]">
                                      Subtotal: £{orderItem.subtotal.toFixed(2)}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeItem(product.id);
                                        setExpandedProduct(null);
                                      }}
                                      className="h-8 text-xs"
                                    >
                                      Remove from Order
                                    </Button>
                                  </div>
                                )}
                                
                                {!hasItems && (
                                  <div className="text-center">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addProduct(product.id);
                                      }}
                                      className="h-8 bg-[#18A5A5] hover:bg-[#185166] text-white text-xs"
                                    >
                                      Add to Order
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mattress Protection Category */}
                {mattressProducts.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-[#185166] mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Mattress Protection
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {mattressProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group cursor-pointer border-2 border-gray-200 rounded-lg p-4 hover:border-[#18A5A5] hover:bg-[#18A5A5]/5 transition-all duration-200 hover:shadow-md"
                          onClick={() => addProduct(product.id)}
                        >
                          <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-[#18A5A5]/10 rounded-lg flex items-center justify-center mx-auto group-hover:bg-[#18A5A5]/20 transition-colors">
                              <Package className="h-6 w-6 text-[#18A5A5]" />
                            </div>
                            <div className="font-medium text-[#185166] text-sm">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">{product.type}</div>
                            <div className="text-lg font-bold text-[#18A5A5]">
                              £{product.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Items Category */}
                {individualProducts.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-[#185166] mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Individual Items
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {individualProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group cursor-pointer border-2 border-gray-200 rounded-lg p-4 hover:border-[#18A5A5] hover:bg-[#18A5A5]/5 transition-all duration-200 hover:shadow-md"
                          onClick={() => addProduct(product.id)}
                        >
                          <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-[#18A5A5]/10 rounded-lg flex items-center justify-center mx-auto group-hover:bg-[#18A5A5]/20 transition-colors">
                              <Package className="h-6 w-6 text-[#18A5A5]" />
                            </div>
                            <div className="font-medium text-[#185166] text-sm">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">{product.type}</div>
                            <div className="text-lg font-bold text-[#18A5A5]">
                              £{product.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Items with Quantity */}
              {orderItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-[#185166] flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Selected Items ({orderItems.length})
                  </h4>
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
                </div>
              )}

              {/* Minimum Order Alert */}
              {orderItems.length > 0 && !meetsMinimum && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Minimum order value is £150. Current total: £{totalCost.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}

              {orderItems.length > 0 && meetsMinimum && (
                <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Order meets minimum requirement</span>
                  </div>
                  <div className="text-xl font-bold text-[#185166]">
                    Total: £{totalCost.toFixed(2)}
                  </div>
                </div>
              )}

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No items selected yet</p>
                  <p className="text-sm">Click on items above to add them to your order</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-white hover:shadow-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#18A5A5]/10 rounded-lg">
                <FileText className="h-5 w-5 text-[#18A5A5]" />
              </div>
              <h3 className="text-lg font-bold text-[#185166]">Additional Notes</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-[#185166]">Special instructions or requests</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for delivery, pickup, or linen preferences..."
                className="min-h-[100px] border-2 border-gray-200 hover:border-[#18A5A5] focus:border-[#18A5A5] rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 font-medium rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedAddress || orderItems.length === 0 || !meetsMinimum || loading}
              className="flex-1 h-12 bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Creating Order...
                </>
              ) : (
                'Create Order'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};