import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X, AlertCircle, MapPin, Calendar, Package, FileText } from 'lucide-react';
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
}

export const CreateLinenOrderDialog: React.FC<CreateLinenOrderDialogProps> = ({
  open,
  onOpenChange,
  onOrderCreated,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
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
      subtotal: product.price
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
  const availableProducts = products.filter(p => !orderItems.some(item => item.productId === p.id));

  const handleSubmit = async () => {
    if (!selectedAddress || orderItems.length === 0 || !meetsMinimum) return;

    setLoading(true);
    try {
      const success = await createOrder({
        addressId: selectedAddress,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        deliveryDate: deliveryDate || undefined,
        pickupDate: pickupDate || undefined,
        notes: notes || undefined
      });

      if (success) {
        // Reset form
        setSelectedAddress('');
        setDeliveryDate('');
        setPickupDate('');
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
    setDeliveryDate('');
    setPickupDate('');
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
          <DialogTitle>Create New Linen Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Address Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Select delivery address *</Label>
                <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery address..." />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses?.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {address.address}, {address.postcode}
                        {address.is_default && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery">Delivery Date (Optional)</Label>
                  <Input
                    id="delivery"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup">Pickup Date (Optional)</Label>
                  <Input
                    id="pickup"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Linen Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select linen product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - £{product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addProduct} 
                  disabled={!selectedProduct}
                  className="bg-[#18A5A5] hover:bg-[#185166] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <Badge variant="secondary" className="flex-1">
                      {item.productName}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-sm font-medium w-20 text-right text-[#185166]">
                      £{item.subtotal.toFixed(2)}
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items selected. Add products above.</p>
                </div>
              )}

              {/* Total and Minimum Check */}
              {orderItems.length > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#185166]">Total Cost:</span>
                    <span className="text-lg font-bold text-[#18A5A5]">£{totalCost.toFixed(2)}</span>
                  </div>
                  
                  {!meetsMinimum && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        We have a minimum charge of £150 for linen orders. 
                        You need £{(150 - totalCost).toFixed(2)} more to meet this requirement.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Special instructions or notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or notes for this order..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedAddress || orderItems.length === 0 || !meetsMinimum || loading}
              className="bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold"
            >
              {loading ? 'Creating Order...' : `Create Order (£${totalCost.toFixed(2)})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};